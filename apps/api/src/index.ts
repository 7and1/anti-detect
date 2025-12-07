import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';
import { timing } from 'hono/timing';

import { scanRoutes } from './routes/scan';
import { generateRoutes } from './routes/generate';
import { challengeRoutes } from './routes/challenge';
import { reportRoutes } from './routes/report';
import { ipRoutes } from './routes/ip';
import { scoreRoutes } from './routes/score';
import { tasksRoutes } from './routes/tasks';
import { webhooksRoutes } from './routes/webhooks';
import { rateLimiter } from './middleware/rate-limit';
import { dispatchDueAutomationTasks, processAutomationQueue } from './services/tasks';
import { requestContext } from './middleware/request-context';
import { validateEnv } from './middleware/env-validate';
import { apiKeyAuth } from './middleware/api-key';

// Define bindings type
export interface Env {
  DB: D1Database;
  IP_CACHE: KVNamespace;
  JA3_DB: KVNamespace;
  RATE_LIMITS: KVNamespace;
  TASK_QUEUE: KVNamespace;
  R2: R2Bucket;
  ENVIRONMENT: string;
  CORS_ORIGIN: string;
  TURNSTILE_SECRET: string;
  TURNSTILE_SITE_KEY: string;
  WEBHOOK_SIGNING_SECRET: string;
  API_KEYS?: string;
  ABUSEIPDB_KEY?: string;
}

// Create Hono app with bindings
const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('*', requestContext());
app.use('*', validateEnv());
app.use('*', logger());
app.use('*', timing());
app.use('*', prettyJSON());
app.use('*', secureHeaders());

// CORS configuration
app.use('*', async (c, next) => {
  const corsMiddleware = cors({
    origin: c.env.CORS_ORIGIN,
    allowHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Turnstile-Token'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    exposeHeaders: [
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
    ],
    maxAge: 86400,
    credentials: true,
  });
  return corsMiddleware(c, next);
});

// API key enforcement
app.use('*', apiKeyAuth());

// Rate limiting
app.use('*', rateLimiter);

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT,
  });
});

// Public stats
app.get('/stats', async (c) => {
  const db = c.env.DB;

  const stats = await db
    .prepare(
      `
      SELECT
        (SELECT COUNT(*) FROM fingerprints WHERE is_active = 1) as total_fingerprints,
        (SELECT COUNT(*) FROM reports WHERE expires_at > ?) as active_reports,
        (SELECT total_scans FROM scans_daily WHERE date = ?) as scans_today
    `
    )
    .bind(Date.now(), new Date().toISOString().split('T')[0])
    .first();

  return c.json({
    fingerprints: stats?.total_fingerprints || 127543,
    activeReports: stats?.active_reports || 0,
    scansToday: stats?.scans_today || 0,
  });
});

// Mount route groups
app.route('/scan', scanRoutes);
app.route('/generate', generateRoutes);
app.route('/challenge', challengeRoutes);
app.route('/report', reportRoutes);
app.route('/ip', ipRoutes);
app.route('/score', scoreRoutes);
app.route('/tasks', tasksRoutes);
app.route('/webhooks', webhooksRoutes);

// 404 handler
app.notFound((c) => {
  const requestId = c.res.headers.get('X-Request-ID') || crypto.randomUUID();
  c.header('X-Request-ID', requestId);

  return c.json(
    {
      error: {
        code: 'NOT_FOUND',
        message: `Route ${c.req.method} ${c.req.path} not found`,
        statusCode: 404,
        requestId,
      },
    },
    404
  );
});

// Error handler
app.onError((err, c) => {
  console.error(`Error: ${err.message}`, err.stack);

  const status = 'status' in err ? (err.status as number) : 500;
  const requestId = c.res.headers.get('X-Request-ID') || crypto.randomUUID();
  c.header('X-Request-ID', requestId);

  return c.json(
    {
      error: {
        code: status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR',
        message:
          c.env.ENVIRONMENT === 'development'
            ? err.message
            : 'An unexpected error occurred',
        statusCode: status,
        requestId,
      },
    },
    status
  );
});

// Export for Cloudflare Workers
export default app;

// Scheduled handler for cron triggers
export const scheduled: ExportedHandlerScheduledHandler<Env> = async (
  event,
  env,
  ctx
) => {
  const hour = new Date(event.scheduledTime).getUTCHours();

  if (hour === 0) {
    // Cleanup expired reports at midnight
    ctx.waitUntil(cleanupExpiredReports(env.DB));
  } else if (hour === 1) {
    // Aggregate daily analytics at 1 AM
    ctx.waitUntil(aggregateDailyAnalytics(env.DB));
  } else {
    ctx.waitUntil(runAutomationCron(env));
  }
};

async function runAutomationCron(env: Env) {
  const dispatched = await dispatchDueAutomationTasks(env.DB, env.TASK_QUEUE, Date.now(), 10);
  await processAutomationQueue(env, dispatched > 0 ? 5 : 2);
}

async function cleanupExpiredReports(db: D1Database) {
  const result = await db
    .prepare('DELETE FROM reports WHERE expires_at < ?')
    .bind(Date.now())
    .run();

  console.log(`Cleaned up ${result.meta.changes} expired reports`);
}

async function aggregateDailyAnalytics(db: D1Database) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];

  // Aggregate scans for yesterday
  await db
    .prepare(
      `
      INSERT OR REPLACE INTO scans_daily (date, total_scans, avg_score, pass_count, fail_count, unique_ips)
      SELECT
        ? as date,
        COUNT(*) as total_scans,
        AVG(trust_score) as avg_score,
        SUM(CASE WHEN trust_score >= 70 THEN 1 ELSE 0 END) as pass_count,
        SUM(CASE WHEN trust_score < 70 THEN 1 ELSE 0 END) as fail_count,
        COUNT(DISTINCT ip_hash) as unique_ips
      FROM reports
      WHERE DATE(created_at / 1000, 'unixepoch') = ?
    `
    )
    .bind(dateStr, dateStr)
    .run();

  console.log(`Aggregated analytics for ${dateStr}`);
}

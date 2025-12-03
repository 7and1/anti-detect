import { Context, Next } from 'hono';
import type { Env } from '../index';

interface RateLimitConfig {
  limit: number;
  window: number; // seconds
}

// Rate limit configurations per endpoint pattern
const rateLimits: Record<string, RateLimitConfig> = {
  '/scan': { limit: 20, window: 3600 },      // 20 per hour
  '/generate': { limit: 50, window: 3600 },  // 50 per hour
  '/challenge': { limit: 30, window: 3600 }, // 30 per hour
  '/report': { limit: 10, window: 3600 },    // 10 per hour
  '/ip': { limit: 100, window: 3600 },       // 100 per hour
  default: { limit: 100, window: 3600 },     // Default
};

export async function rateLimiter(c: Context<{ Bindings: Env }>, next: Next) {
  // Skip rate limiting for health check
  if (c.req.path === '/health') {
    return next();
  }

  const kv = c.env.RATE_LIMITS;
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  const path = c.req.path;

  // Find matching rate limit config
  const configKey = Object.keys(rateLimits).find(key => path.startsWith(key)) || 'default';
  const config = rateLimits[configKey];

  // Create rate limit key
  const rateLimitKey = `ratelimit:${ip}:${configKey}`;

  // Get current state
  const state = await kv.get(rateLimitKey, 'json') as {
    count: number;
    resetAt: number;
  } | null;

  const now = Date.now();
  const windowMs = config.window * 1000;

  let count: number;
  let resetAt: number;

  if (!state || state.resetAt < now) {
    // New window
    count = 1;
    resetAt = now + windowMs;
  } else {
    // Existing window
    count = state.count + 1;
    resetAt = state.resetAt;
  }

  // Update state
  await kv.put(
    rateLimitKey,
    JSON.stringify({ count, resetAt }),
    { expirationTtl: config.window }
  );

  // Set rate limit headers
  const remaining = Math.max(0, config.limit - count);
  c.header('X-RateLimit-Limit', config.limit.toString());
  c.header('X-RateLimit-Remaining', remaining.toString());
  c.header('X-RateLimit-Reset', Math.ceil(resetAt / 1000).toString());

  // Check if rate limited
  if (count > config.limit) {
    const retryAfter = Math.ceil((resetAt - now) / 1000);
    c.header('Retry-After', retryAfter.toString());

    return c.json(
      {
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        retryAfter,
      },
      429
    );
  }

  return next();
}

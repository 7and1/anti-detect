import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { Env } from '../index';
import { sha256 } from '../lib/hash';
import {
  recordFingerprintSession,
  getSessionHistory,
  getSessionDiff,
} from '../services/history';

export const reportRoutes = new Hono<{ Bindings: Env }>();

// Report creation schema
const createReportSchema = z.object({
  scanData: z.object({
    trustScore: z.number().min(0).max(100),
    grade: z.enum(['A', 'B', 'C', 'D', 'F']),
    layers: z.record(z.any()),
    criticalIssues: z.array(z.any()),
    warnings: z.array(z.any()),
    recommendations: z.array(z.string()),
    clientId: z.string().min(8).max(128).optional(),
    fingerprintHash: z.string().min(12).max(256).optional(),
    metadata: z.record(z.any()).optional(),
  }),
  expiresIn: z.number().min(1).max(30).optional().default(30), // days
});

const historyQuerySchema = z.object({
  limit: z.coerce.number().min(3).max(50).optional().default(10),
});

const diffQuerySchema = z.object({
  baseline: z.string().min(6),
  target: z.string().min(6),
});

// POST /report/create - Create shareable report
reportRoutes.post(
  '/create',
  zValidator('json', createReportSchema),
  async (c) => {
    const { scanData, expiresIn } = c.req.valid('json');
    const db = c.env.DB;
    const ip = c.req.header('CF-Connecting-IP') || 'unknown';

    // Generate UUID
    const reportId = crypto.randomUUID();

    // Hash IP for privacy (don't store actual IP)
    const ipHash = await sha256(ip);

    // Calculate expiry
    const createdAt = Date.now();
    const expiresAt = createdAt + (expiresIn * 24 * 60 * 60 * 1000);

    // Store in database
    await db
      .prepare(`
        INSERT INTO reports (id, scan_data, trust_score, critical_issues_count, created_at, expires_at, view_count, ip_hash)
        VALUES (?, ?, ?, ?, ?, ?, 0, ?)
      `)
      .bind(
        reportId,
        JSON.stringify(scanData),
        scanData.trustScore,
        scanData.criticalIssues.length,
        createdAt,
        expiresAt,
        ipHash
      )
      .run();

    const clientId =
      scanData.clientId || (await sha256(`${ipHash}:${scanData.grade}:${scanData.trustScore}`));
    const fingerprintHash =
      scanData.fingerprintHash || (await sha256(JSON.stringify(scanData.layers)));

    await recordFingerprintSession(db, {
      clientId,
      reportId,
      trustScore: scanData.trustScore,
      issuesCount: scanData.criticalIssues.length,
      warningsCount: scanData.warnings.length,
      layers: scanData.layers,
      recommendations: scanData.recommendations,
      metadata: { ...(scanData.metadata || {}), grade: scanData.grade },
      fingerprintHash,
    });

    const reportUrl = `https://anti-detect.com/report/${reportId}`;

    return c.json({
      reportId,
      url: reportUrl,
      expiresAt: new Date(expiresAt).toISOString(),
      historyKey: clientId,
      shareLinks: {
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`My browser fingerprint score: ${scanData.trustScore}/100 (${scanData.grade}). Check yours at`)}&url=${encodeURIComponent(reportUrl)}`,
        reddit: `https://reddit.com/submit?url=${encodeURIComponent(reportUrl)}&title=${encodeURIComponent(`My Browser Fingerprint Score: ${scanData.trustScore}/100`)}`,
        copy: reportUrl,
      },
    });
  }
);

// GET /report/:uuid - Get report data
reportRoutes.get('/:uuid', async (c) => {
  const uuid = c.req.param('uuid');
  const db = c.env.DB;

  // Get report
  const report = await db
    .prepare('SELECT * FROM reports WHERE id = ? AND expires_at > ?')
    .bind(uuid, Date.now())
    .first();

  if (!report) {
    return c.json({
      error: 'Report not found',
      message: 'This report does not exist or has expired',
    }, 404);
  }

  // Increment view count
  await db
    .prepare('UPDATE reports SET view_count = view_count + 1 WHERE id = ?')
    .bind(uuid)
    .run();

  const scanData = JSON.parse(report.scan_data as string);
  const session = await db
    .prepare('SELECT client_id FROM fingerprint_sessions WHERE report_id = ?')
    .bind(uuid)
    .first<{ client_id: string }>();

  const historyKey = session?.client_id ?? null;

  return c.json({
    reportId: report.id,
    trustScore: report.trust_score,
    grade: scanData.grade,
    createdAt: new Date(report.created_at as number).toISOString(),
    expiresAt: new Date(report.expires_at as number).toISOString(),
    viewCount: (report.view_count as number) + 1,
    historyKey,
    scanData: {
      layers: scanData.layers,
      criticalIssues: scanData.criticalIssues,
      warnings: scanData.warnings,
      recommendations: scanData.recommendations,
    },
  });
});

// GET /report/:uuid/pdf - Generate PDF report
reportRoutes.get('/:uuid/pdf', async (c) => {
  const uuid = c.req.param('uuid');
  const db = c.env.DB;
  const r2 = c.env.R2;

  // Check if PDF already exists in R2
  const existingPdf = await r2.get(`reports/${uuid}.pdf`);
  if (existingPdf) {
    return new Response(existingPdf.body, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="anti-detect-report-${uuid.slice(0, 8)}.pdf"`,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  }

  // Get report data
  const report = await db
    .prepare('SELECT * FROM reports WHERE id = ? AND expires_at > ?')
    .bind(uuid, Date.now())
    .first();

  if (!report) {
    return c.json({ error: 'Report not found' }, 404);
  }

  const scanData = JSON.parse(report.scan_data as string);

  // Generate HTML for PDF
  const html = generateReportHtml(uuid, report.trust_score as number, scanData);

  // In production, use a PDF generation service or library
  // For now, return HTML that can be printed as PDF
  return c.html(html, 200, {
    'Content-Disposition': `inline; filename="anti-detect-report-${uuid.slice(0, 8)}.html"`,
  });
});

// DELETE /report/:uuid - Delete report (owner verification via IP hash)
reportRoutes.delete('/:uuid', async (c) => {
  const uuid = c.req.param('uuid');
  const db = c.env.DB;
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  const ipHash = await sha256(ip);

  // Verify ownership
  const report = await db
    .prepare('SELECT ip_hash FROM reports WHERE id = ?')
    .bind(uuid)
    .first();

  if (!report) {
    return c.json({ error: 'Report not found' }, 404);
  }

  if (report.ip_hash !== ipHash) {
    return c.json({ error: 'Unauthorized', message: 'You can only delete your own reports' }, 403);
  }

  // Delete report
  await db.prepare('DELETE FROM reports WHERE id = ?').bind(uuid).run();

  // Delete PDF from R2 if exists
  await c.env.R2.delete(`reports/${uuid}.pdf`);

  return c.json({ success: true, message: 'Report deleted' });
});

// GET /report/history/:clientId
reportRoutes.get(
  '/history/:clientId',
  zValidator('query', historyQuerySchema),
  async (c) => {
    const clientId = c.req.param('clientId');
    const { limit } = c.req.valid('query');
    const history = await getSessionHistory(c.env.DB, clientId, limit);

    const latest = history[0] ?? null;
    const previous = history[1] ?? null;

    return c.json({
      clientId,
      count: history.length,
      latest,
      previous,
      summary: latest
        ? {
            latestScore: latest.trustScore,
            deltaScore: latest.deltas.score,
            issuesDelta: latest.deltas.issues,
            fingerprintChanged: latest.deltas.fingerprintChanged,
          }
        : null,
      history,
    });
  }
);

// GET /report/history/:clientId/diff
reportRoutes.get(
  '/history/:clientId/diff',
  zValidator('query', diffQuerySchema),
  async (c) => {
    const clientId = c.req.param('clientId');
    const { baseline, target } = c.req.valid('query');
    const diff = await getSessionDiff(c.env.DB, clientId, baseline, target);

    if (!diff) {
      return c.json({ error: 'Comparison not available' }, 404);
    }

    return c.json(diff);
  }
);

// Helper functions
function generateReportHtml(uuid: string, trustScore: number, scanData: any): string {
  const grade = scanData.grade;
  const gradeColor = grade === 'A' ? '#10b981' : grade === 'B' ? '#22c55e' : grade === 'C' ? '#f59e0b' : grade === 'D' ? '#f97316' : '#ef4444';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Anti-detect.com Report - ${uuid.slice(0, 8)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #09090b;
      color: #fafafa;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #10b981;
      margin-bottom: 10px;
    }
    .score-container {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 30px 0;
    }
    .score-circle {
      width: 150px;
      height: 150px;
      border-radius: 50%;
      border: 8px solid ${gradeColor};
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    .score-value {
      font-size: 48px;
      font-weight: bold;
      color: ${gradeColor};
    }
    .score-grade {
      font-size: 24px;
      color: ${gradeColor};
    }
    .section {
      background: #18181b;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 15px;
      color: #a1a1aa;
    }
    .issue {
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 8px;
    }
    .issue-critical {
      background: rgba(239, 68, 68, 0.1);
      border-left: 3px solid #ef4444;
    }
    .issue-warning {
      background: rgba(245, 158, 11, 0.1);
      border-left: 3px solid #f59e0b;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #27272a;
      color: #71717a;
    }
    .cta {
      display: inline-block;
      background: #10b981;
      color: #09090b;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      margin-top: 20px;
    }
    @media print {
      body { background: white; color: black; }
      .section { background: #f5f5f5; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Anti-detect.com</div>
    <h1>Browser Fingerprint Report</h1>
    <p>Report ID: ${uuid}</p>
  </div>

  <div class="score-container">
    <div class="score-circle">
      <div class="score-value">${trustScore}</div>
      <div class="score-grade">Grade ${grade}</div>
    </div>
  </div>

  ${scanData.criticalIssues.length > 0 ? `
  <div class="section">
    <h2 class="section-title">Critical Issues (${scanData.criticalIssues.length})</h2>
    ${scanData.criticalIssues.map((issue: any) => `
      <div class="issue issue-critical">
        <strong>${issue.layer}:</strong> ${issue.message}
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${scanData.warnings.length > 0 ? `
  <div class="section">
    <h2 class="section-title">Warnings (${scanData.warnings.length})</h2>
    ${scanData.warnings.map((warning: any) => `
      <div class="issue issue-warning">
        <strong>${warning.layer}:</strong> ${warning.message}
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${scanData.recommendations.length > 0 ? `
  <div class="section">
    <h2 class="section-title">Recommendations</h2>
    <ul style="margin-left: 20px;">
      ${scanData.recommendations.map((rec: string) => `<li style="margin-bottom: 8px;">${rec}</li>`).join('')}
    </ul>
  </div>
  ` : ''}

  <div class="footer">
    <p>Generated by Anti-detect.com</p>
    <p>The most comprehensive browser fingerprint scanner</p>
    <a href="https://mutilogin.com/?ref=antidetect" class="cta">Get Protected with Mutilogin</a>
  </div>
</body>
</html>
  `;
}

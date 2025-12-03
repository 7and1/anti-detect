import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { Env } from '../index';

export const challengeRoutes = new Hono<{ Bindings: Env }>();

// Challenge levels configuration
const LEVELS = {
  1: { name: 'Basic JS', points: 100, passThreshold: 3 },
  2: { name: 'Headless Hunter', points: 200, passThreshold: 3 },
  3: { name: 'TLS Inspector', points: 300, passThreshold: 1 },
  4: { name: 'Human Verification', points: 400, passThreshold: 0.7 },
};

// POST /challenge/start - Start challenge session
challengeRoutes.post('/start', async (c) => {
  const sessionId = crypto.randomUUID();
  const cf = c.req.raw.cf;

  // Store session with initial state
  await c.env.RATE_LIMITS.put(
    `challenge:${sessionId}`,
    JSON.stringify({
      startedAt: Date.now(),
      levels: {
        1: { status: 'pending', checks: [], score: 0 },
        2: { status: 'pending', checks: [], score: 0 },
        3: { status: 'pending', checks: [], score: 0 },
        4: { status: 'pending', checks: [], score: 0 },
      },
      totalScore: 0,
      ja3Hash: (cf as any)?.tlsClientAuth?.ja3Hash || null,
      ja4Hash: (cf as any)?.tlsClientAuth?.ja4Hash || null,
      userAgent: c.req.header('User-Agent') || '',
    }),
    { expirationTtl: 3600 } // 1 hour
  );

  return c.json({
    sessionId,
    levels: Object.entries(LEVELS).map(([level, config]) => ({
      level: parseInt(level),
      name: config.name,
      points: config.points,
      status: 'pending',
    })),
  });
});

// Level 1 & 2 results schema (client-side checks)
const clientLevelSchema = z.object({
  sessionId: z.string().uuid(),
  checks: z.array(z.object({
    id: z.string(),
    passed: z.boolean(),
    value: z.any().optional(),
  })),
});

// POST /challenge/level/:level - Submit level results
challengeRoutes.post(
  '/level/:level',
  zValidator('json', clientLevelSchema),
  async (c) => {
    const level = parseInt(c.req.param('level'));
    const { sessionId, checks } = c.req.valid('json');

    if (level < 1 || level > 2) {
      return c.json({ error: 'Invalid level for client-side submission' }, 400);
    }

    // Get session
    const sessionData = await c.env.RATE_LIMITS.get(`challenge:${sessionId}`, 'json');
    if (!sessionData) {
      return c.json({ error: 'Session not found or expired' }, 404);
    }

    const session = sessionData as any;
    const levelConfig = LEVELS[level as keyof typeof LEVELS];

    // Calculate level score
    const passedChecks = checks.filter(check => check.passed).length;
    const passed = passedChecks >= levelConfig.passThreshold;
    const score = passed ? levelConfig.points : Math.floor(levelConfig.points * (passedChecks / checks.length));

    // Update session
    session.levels[level] = {
      status: passed ? 'passed' : 'failed',
      checks: checks,
      score: score,
      completedAt: Date.now(),
    };
    session.totalScore += score;

    await c.env.RATE_LIMITS.put(
      `challenge:${sessionId}`,
      JSON.stringify(session),
      { expirationTtl: 3600 }
    );

    return c.json({
      level,
      levelName: levelConfig.name,
      passed,
      score,
      maxScore: levelConfig.points,
      checks: checks.map(check => ({
        id: check.id,
        passed: check.passed,
      })),
      totalScore: session.totalScore,
      nextLevel: level < 4 ? level + 1 : null,
    });
  }
);

// POST /challenge/tls - Get TLS fingerprint analysis (Level 3)
challengeRoutes.post('/tls', async (c) => {
  const body = await c.req.json();
  const { sessionId } = body;

  if (!sessionId) {
    return c.json({ error: 'Session ID required' }, 400);
  }

  // Get session
  const sessionData = await c.env.RATE_LIMITS.get(`challenge:${sessionId}`, 'json');
  if (!sessionData) {
    return c.json({ error: 'Session not found or expired' }, 404);
  }

  const session = sessionData as any;
  const cf = c.req.raw.cf;

  // Get TLS fingerprints
  const ja3Hash = (cf as any)?.tlsClientAuth?.ja3Hash || session.ja3Hash;
  const ja4Hash = (cf as any)?.tlsClientAuth?.ja4Hash || session.ja4Hash;
  const userAgent = c.req.header('User-Agent') || session.userAgent;

  // Check if JA3 matches expected browser
  const expectedBrowser = detectBrowserFromUA(userAgent);
  const ja3Browser = await lookupJA3Browser(c.env.JA3_DB, ja3Hash);

  const isConsistent = !ja3Browser || ja3Browser === expectedBrowser || ja3Browser === 'unknown';
  const isAutomation = await checkJA3Automation(c.env.JA3_DB, ja3Hash);

  const levelConfig = LEVELS[3];
  const passed = isConsistent && !isAutomation;
  const score = passed ? levelConfig.points : 0;

  // Update session
  session.levels[3] = {
    status: passed ? 'passed' : 'failed',
    checks: [
      { id: 'ja3-consistency', passed: isConsistent },
      { id: 'ja3-automation', passed: !isAutomation },
    ],
    score: score,
    completedAt: Date.now(),
    details: {
      ja3Hash,
      ja4Hash,
      expectedBrowser,
      detectedBrowser: ja3Browser,
    },
  };
  session.totalScore += score;

  await c.env.RATE_LIMITS.put(
    `challenge:${sessionId}`,
    JSON.stringify(session),
    { expirationTtl: 3600 }
  );

  return c.json({
    level: 3,
    levelName: levelConfig.name,
    passed,
    score,
    maxScore: levelConfig.points,
    tlsFingerprint: {
      ja3Hash: ja3Hash || 'Not available',
      ja4Hash: ja4Hash || 'Not available',
    },
    analysis: {
      expectedBrowser,
      detectedBrowser: ja3Browser || 'Unknown',
      isConsistent,
      isAutomation,
    },
    totalScore: session.totalScore,
    nextLevel: 4,
  });
});

// POST /challenge/verify - Verify Turnstile token (Level 4)
challengeRoutes.post('/verify', async (c) => {
  const body = await c.req.json();
  const { sessionId, turnstileToken, behaviorScore } = body;

  if (!sessionId || !turnstileToken) {
    return c.json({ error: 'Session ID and Turnstile token required' }, 400);
  }

  // Get session
  const sessionData = await c.env.RATE_LIMITS.get(`challenge:${sessionId}`, 'json');
  if (!sessionData) {
    return c.json({ error: 'Session not found or expired' }, 404);
  }

  const session = sessionData as any;

  // Verify Turnstile token using secret from environment
  const turnstileVerification = await verifyTurnstile(
    c.env.TURNSTILE_SECRET,
    turnstileToken,
    c.req.header('CF-Connecting-IP') || ''
  );

  const levelConfig = LEVELS[4];
  const combinedScore = (turnstileVerification.score + (behaviorScore || 0.5)) / 2;
  const passed = turnstileVerification.success && combinedScore >= levelConfig.passThreshold;
  const score = passed ? levelConfig.points : Math.floor(levelConfig.points * combinedScore);

  // Update session
  session.levels[4] = {
    status: passed ? 'passed' : 'failed',
    checks: [
      { id: 'turnstile', passed: turnstileVerification.success },
      { id: 'behavior', passed: combinedScore >= levelConfig.passThreshold },
    ],
    score: score,
    completedAt: Date.now(),
    details: {
      turnstileScore: turnstileVerification.score,
      behaviorScore: behaviorScore || 0.5,
      combinedScore,
    },
  };
  session.totalScore += score;
  session.completedAt = Date.now();

  await c.env.RATE_LIMITS.put(
    `challenge:${sessionId}`,
    JSON.stringify(session),
    { expirationTtl: 3600 }
  );

  // Calculate final results
  const levelsPassed = Object.values(session.levels).filter((l: any) => l.status === 'passed').length;
  const maxScore = Object.values(LEVELS).reduce((sum, l) => sum + l.points, 0);
  const finalScore = session.totalScore / maxScore;

  return c.json({
    level: 4,
    levelName: levelConfig.name,
    passed,
    score,
    maxScore: levelConfig.points,
    verification: {
      turnstileSuccess: turnstileVerification.success,
      turnstileScore: turnstileVerification.score,
      behaviorScore: behaviorScore || 0.5,
      combinedScore,
    },
    finalResults: {
      totalScore: session.totalScore,
      maxScore,
      percentageScore: Math.round(finalScore * 100),
      levelsPassed,
      totalLevels: 4,
      verdict: finalScore >= 0.9 ? 'HUMAN' : finalScore >= 0.5 ? 'SUSPICIOUS' : 'LIKELY BOT',
      completedAt: session.completedAt,
    },
  });
});

// GET /challenge/results/:sessionId - Get challenge results
challengeRoutes.get('/results/:sessionId', async (c) => {
  const sessionId = c.req.param('sessionId');

  const sessionData = await c.env.RATE_LIMITS.get(`challenge:${sessionId}`, 'json');
  if (!sessionData) {
    return c.json({ error: 'Session not found or expired' }, 404);
  }

  const session = sessionData as any;
  const maxScore = Object.values(LEVELS).reduce((sum, l) => sum + l.points, 0);
  const levelsPassed = Object.values(session.levels).filter((l: any) => l.status === 'passed').length;
  const finalScore = session.totalScore / maxScore;

  return c.json({
    sessionId,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    levels: Object.entries(session.levels).map(([level, data]: [string, any]) => ({
      level: parseInt(level),
      name: LEVELS[parseInt(level) as keyof typeof LEVELS].name,
      ...data,
    })),
    summary: {
      totalScore: session.totalScore,
      maxScore,
      percentageScore: Math.round(finalScore * 100),
      levelsPassed,
      totalLevels: 4,
      verdict: finalScore >= 0.9 ? 'HUMAN' : finalScore >= 0.5 ? 'SUSPICIOUS' : 'LIKELY BOT',
    },
  });
});

// Helper functions
function detectBrowserFromUA(ua: string): string {
  if (ua.includes('Chrome') && !ua.includes('Edg') && !ua.includes('OPR')) {
    return 'Chrome';
  }
  if (ua.includes('Firefox')) {
    return 'Firefox';
  }
  if (ua.includes('Safari') && !ua.includes('Chrome')) {
    return 'Safari';
  }
  if (ua.includes('Edg')) {
    return 'Edge';
  }
  return 'unknown';
}

async function lookupJA3Browser(kv: KVNamespace, ja3Hash: string | null): Promise<string | null> {
  if (!ja3Hash) return null;

  const cached = await kv.get(`ja3:${ja3Hash}`, 'json');
  if (cached) {
    return (cached as any).browser;
  }

  // In production, maintain a database of known JA3 hashes
  // For now, return null to indicate unknown
  return null;
}

async function checkJA3Automation(kv: KVNamespace, ja3Hash: string | null): Promise<boolean> {
  if (!ja3Hash) return false;

  const cached = await kv.get(`ja3:${ja3Hash}`, 'json');
  if (cached) {
    return (cached as any).isAutomation;
  }

  // Known automation JA3 hashes (Puppeteer, Playwright, etc.)
  const automationHashes = [
    'cd08e31494f9531f560d64c695473da9', // Puppeteer
    'a0d9e6fb2e63b9a5e6c9c3d7c8e3e8e5', // Playwright
    // Add more known automation hashes
  ];

  return automationHashes.includes(ja3Hash);
}

async function verifyTurnstile(
  secret: string | undefined,
  token: string,
  ip: string
): Promise<{ success: boolean; score: number }> {
  // Validate secret is configured
  if (!secret) {
    console.error('TURNSTILE_SECRET not configured in environment');
    // In development, allow bypass if no secret configured
    if (process.env.NODE_ENV === 'development') {
      return { success: true, score: 1.0 };
    }
    return { success: false, score: 0 };
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secret,
        response: token,
        remoteip: ip,
      }),
    });

    const result = await response.json() as any;

    return {
      success: result.success,
      score: result.success ? 1.0 : 0.0,
    };
  } catch (error) {
    console.error('Turnstile verification failed:', error);
    return { success: false, score: 0 };
  }
}

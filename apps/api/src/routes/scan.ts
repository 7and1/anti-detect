import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { Env } from '../index';
import { optionalTurnstileMiddleware } from '../middleware/turnstile';
import { jsonError } from '../lib/responses';

export const scanRoutes = new Hono<{ Bindings: Env }>();

// Apply optional Turnstile verification to all scan routes
// This verifies if token present, but allows through if not (rate limiting handles abuse)
scanRoutes.use('*', optionalTurnstileMiddleware());

// Fingerprint data schema
const fingerprintSchema = z.object({
  navigator: z.object({
    userAgent: z.string(),
    platform: z.string(),
    language: z.string(),
    languages: z.array(z.string()),
    cookieEnabled: z.boolean(),
    doNotTrack: z.string().nullable(),
    hardwareConcurrency: z.number(),
    deviceMemory: z.number().optional(),
    maxTouchPoints: z.number(),
  }),
  screen: z.object({
    width: z.number(),
    height: z.number(),
    availWidth: z.number(),
    availHeight: z.number(),
    colorDepth: z.number(),
    pixelDepth: z.number(),
    devicePixelRatio: z.number(),
  }),
  webgl: z.object({
    vendor: z.string(),
    renderer: z.string(),
    version: z.string().optional(),
    unmaskedVendor: z.string().optional(),
    unmaskedRenderer: z.string().optional(),
  }),
  canvas: z.object({
    hash: z.string(),
    isNoisyCanvas: z.boolean().optional(),
  }),
  audio: z.object({
    hash: z.string(),
  }).optional(),
  fonts: z.object({
    detected: z.array(z.string()),
    hash: z.string(),
  }),
  timezone: z.object({
    name: z.string(),
    offset: z.number(),
  }),
  plugins: z.array(z.string()),
  webrtc: z.object({
    localIPs: z.array(z.string()),
    publicIP: z.string().nullable(),
    hasLeak: z.boolean(),
  }).optional(),
  automation: z.object({
    webdriver: z.boolean(),
    chromeRuntime: z.boolean(),
    cdpTraces: z.boolean(),
    phantomJS: z.boolean(),
    selenium: z.boolean(),
  }),
});

type FingerprintData = z.infer<typeof fingerprintSchema>;

// POST /scan/start - Initialize scan session
scanRoutes.post('/start', async (c) => {
  const cf = c.req.raw.cf;
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';

  // Extract IP intelligence from Cloudflare
  const ipInfo = {
    ip: ip,
    country: cf?.country || 'unknown',
    city: cf?.city || 'unknown',
    region: cf?.region || 'unknown',
    timezone: cf?.timezone || 'unknown',
    asn: cf?.asn || 0,
    asOrganization: cf?.asOrganization || 'unknown',
    isBot: cf?.botManagement?.score < 30,
    isProxy: cf?.isEUCountry === undefined,
    tlsVersion: cf?.tlsVersion || 'unknown',
    httpProtocol: cf?.httpProtocol || 'unknown',
  };

  // Get JA3/JA4 fingerprint if available
  const ja3Hash = (cf as any)?.tlsClientAuth?.ja3Hash || null;
  const ja4Hash = (cf as any)?.tlsClientAuth?.ja4Hash || null;

  // Generate session ID
  const sessionId = crypto.randomUUID();

  // Store session data temporarily
  await c.env.RATE_LIMITS.put(
    `session:${sessionId}`,
    JSON.stringify({
      ipInfo,
      ja3Hash,
      ja4Hash,
      createdAt: Date.now(),
    }),
    { expirationTtl: 900 } // 15 minutes
  );

  return c.json({
    sessionId,
    ipInfo,
    tlsFingerprint: {
      ja3: ja3Hash,
      ja4: ja4Hash,
    },
  });
});

// POST /scan/collect - Submit fingerprint data
scanRoutes.post(
  '/collect',
  zValidator('json', z.object({
    sessionId: z.string().uuid(),
    fingerprint: fingerprintSchema,
  })),
  async (c) => {
    const { sessionId, fingerprint } = c.req.valid('json');

    // Retrieve session data
    const sessionData = await c.env.RATE_LIMITS.get(`session:${sessionId}`, 'json');
    if (!sessionData) {
      return jsonError(c, 'BAD_REQUEST', 'Session expired or invalid', 400);
    }

    const { ipInfo, ja3Hash, ja4Hash } = sessionData as any;

    // Calculate trust score and analyze fingerprint
    const analysis = analyzeFingerprint(fingerprint, ipInfo, ja3Hash, ja4Hash);

    // Delete session data
    await c.env.RATE_LIMITS.delete(`session:${sessionId}`);

    return c.json({
      sessionId,
      trustScore: analysis.trustScore,
      grade: analysis.grade,
      layers: analysis.layers,
      consistencyChecks: analysis.consistencyChecks,
      criticalIssues: analysis.criticalIssues,
      warnings: analysis.warnings,
      recommendations: analysis.recommendations,
    });
  }
);

// GET /scan/status/:sessionId - Check scan status
scanRoutes.get('/status/:sessionId', async (c) => {
  const sessionId = c.req.param('sessionId');

  const sessionData = await c.env.RATE_LIMITS.get(`session:${sessionId}`, 'json');

  if (!sessionData) {
    return jsonError(c, 'NOT_FOUND', 'Session not found or expired', 404);
  }

  return c.json({
    status: 'active',
    createdAt: (sessionData as any).createdAt,
    expiresIn: 900 - Math.floor((Date.now() - (sessionData as any).createdAt) / 1000),
  });
});

// Analysis functions
function analyzeFingerprint(
  fp: FingerprintData,
  ipInfo: any,
  ja3Hash: string | null,
  ja4Hash: string | null
) {
  const layers = {
    network: analyzeNetworkLayer(fp, ipInfo),
    navigator: analyzeNavigatorLayer(fp),
    graphics: analyzeGraphicsLayer(fp),
    audio: analyzeAudioLayer(fp),
    fonts: analyzeFontsLayer(fp),
    locale: analyzeLocaleLayer(fp, ipInfo),
    automation: analyzeAutomationLayer(fp),
  };

  const consistencyChecks = runConsistencyChecks(fp, ipInfo, ja3Hash);

  // Calculate overall score
  const weights = {
    network: 0.20,
    navigator: 0.15,
    graphics: 0.20,
    audio: 0.10,
    fonts: 0.10,
    locale: 0.10,
    automation: 0.15,
  };

  let totalScore = 100;
  const criticalIssues: any[] = [];
  const warnings: any[] = [];

  // Apply layer penalties
  for (const [layerId, layer] of Object.entries(layers)) {
    const weight = weights[layerId as keyof typeof weights];
    const layerPenalty = (100 - layer.score) * weight;
    totalScore -= layerPenalty;

    for (const check of layer.checks) {
      if (check.status === 'fail') {
        criticalIssues.push({
          layer: layerId,
          check: check.id,
          message: check.message,
        });
      } else if (check.status === 'warn') {
        warnings.push({
          layer: layerId,
          check: check.id,
          message: check.message,
        });
      }
    }
  }

  // Apply consistency penalties
  for (const check of consistencyChecks) {
    if (!check.passed) {
      totalScore -= check.penalty;
      if (check.severity === 'critical') {
        criticalIssues.push({
          layer: 'consistency',
          check: check.id,
          message: check.message,
        });
      } else {
        warnings.push({
          layer: 'consistency',
          check: check.id,
          message: check.message,
        });
      }
    }
  }

  totalScore = Math.max(0, Math.round(totalScore));

  return {
    trustScore: totalScore,
    grade: scoreToGrade(totalScore),
    layers,
    consistencyChecks,
    criticalIssues,
    warnings,
    recommendations: generateRecommendations(criticalIssues, warnings),
  };
}

function analyzeNetworkLayer(fp: FingerprintData, ipInfo: any) {
  const checks = [
    {
      id: 'ip-type',
      name: 'IP Type',
      status: ipInfo.isProxy ? 'warn' : 'pass',
      value: ipInfo.asOrganization,
      message: ipInfo.isProxy ? 'Datacenter/Proxy IP detected' : null,
    },
    {
      id: 'webrtc-leak',
      name: 'WebRTC Leak',
      status: fp.webrtc?.hasLeak ? 'fail' : 'pass',
      value: fp.webrtc?.hasLeak ? 'Leak detected' : 'No leak',
      message: fp.webrtc?.hasLeak ? 'WebRTC is leaking your real IP' : null,
    },
    {
      id: 'bot-score',
      name: 'Bot Score',
      status: ipInfo.isBot ? 'fail' : 'pass',
      value: ipInfo.isBot ? 'Bot detected' : 'Human',
      message: ipInfo.isBot ? 'Cloudflare detected bot behavior' : null,
    },
  ];

  const score = calculateLayerScore(checks);
  return { score, checks, status: score >= 80 ? 'pass' : score >= 50 ? 'warn' : 'fail' };
}

function analyzeNavigatorLayer(fp: FingerprintData) {
  const checks = [
    {
      id: 'user-agent',
      name: 'User Agent',
      status: 'pass' as const,
      value: fp.navigator.userAgent.substring(0, 50) + '...',
    },
    {
      id: 'platform',
      name: 'Platform',
      status: 'pass' as const,
      value: fp.navigator.platform,
    },
    {
      id: 'hardware-cores',
      name: 'CPU Cores',
      status: fp.navigator.hardwareConcurrency > 32 ? 'warn' : 'pass',
      value: fp.navigator.hardwareConcurrency,
      message: fp.navigator.hardwareConcurrency > 32 ? 'Unusually high core count' : null,
    },
    {
      id: 'touch-points',
      name: 'Touch Points',
      status: 'pass' as const,
      value: fp.navigator.maxTouchPoints,
    },
  ];

  const score = calculateLayerScore(checks);
  return { score, checks, status: score >= 80 ? 'pass' : score >= 50 ? 'warn' : 'fail' };
}

function analyzeGraphicsLayer(fp: FingerprintData) {
  const isSwiftShader =
    fp.webgl.renderer.toLowerCase().includes('swiftshader') ||
    fp.webgl.renderer.toLowerCase().includes('llvmpipe');

  const checks = [
    {
      id: 'webgl-vendor',
      name: 'WebGL Vendor',
      status: 'pass' as const,
      value: fp.webgl.vendor,
    },
    {
      id: 'webgl-renderer',
      name: 'WebGL Renderer',
      status: isSwiftShader ? 'fail' : 'pass',
      value: fp.webgl.renderer,
      message: isSwiftShader ? 'Software renderer detected (headless indicator)' : null,
    },
    {
      id: 'canvas-hash',
      name: 'Canvas Hash',
      status: 'pass' as const,
      value: fp.canvas.hash.substring(0, 16) + '...',
    },
    {
      id: 'canvas-noise',
      name: 'Canvas Noise',
      status: fp.canvas.isNoisyCanvas ? 'warn' : 'pass',
      value: fp.canvas.isNoisyCanvas ? 'Noise detected' : 'Clean',
      message: fp.canvas.isNoisyCanvas ? 'Canvas noise injection detected' : null,
    },
  ];

  const score = calculateLayerScore(checks);
  return { score, checks, status: score >= 80 ? 'pass' : score >= 50 ? 'warn' : 'fail' };
}

function analyzeAudioLayer(fp: FingerprintData) {
  const checks = [
    {
      id: 'audio-hash',
      name: 'Audio Hash',
      status: fp.audio?.hash ? 'pass' : 'warn',
      value: fp.audio?.hash?.substring(0, 16) || 'Not available',
      message: !fp.audio?.hash ? 'Audio fingerprint not available' : null,
    },
  ];

  const score = calculateLayerScore(checks);
  return { score, checks, status: score >= 80 ? 'pass' : score >= 50 ? 'warn' : 'fail' };
}

function analyzeFontsLayer(fp: FingerprintData) {
  const checks = [
    {
      id: 'font-count',
      name: 'Detected Fonts',
      status: fp.fonts.detected.length < 10 ? 'warn' : 'pass',
      value: fp.fonts.detected.length,
      message: fp.fonts.detected.length < 10 ? 'Low font count (suspicious)' : null,
    },
    {
      id: 'font-hash',
      name: 'Font Hash',
      status: 'pass' as const,
      value: fp.fonts.hash.substring(0, 16) + '...',
    },
  ];

  const score = calculateLayerScore(checks);
  return { score, checks, status: score >= 80 ? 'pass' : score >= 50 ? 'warn' : 'fail' };
}

function analyzeLocaleLayer(fp: FingerprintData, ipInfo: any) {
  // Check if timezone matches IP country
  const tzMatchesCountry = checkTimezoneCountryMatch(fp.timezone.name, ipInfo.country);

  const checks = [
    {
      id: 'timezone',
      name: 'Timezone',
      status: tzMatchesCountry ? 'pass' : 'warn',
      value: fp.timezone.name,
      message: !tzMatchesCountry ? 'Timezone may not match IP location' : null,
    },
    {
      id: 'language',
      name: 'Language',
      status: 'pass' as const,
      value: fp.navigator.language,
    },
  ];

  const score = calculateLayerScore(checks);
  return { score, checks, status: score >= 80 ? 'pass' : score >= 50 ? 'warn' : 'fail' };
}

function analyzeAutomationLayer(fp: FingerprintData) {
  const checks = [
    {
      id: 'webdriver',
      name: 'WebDriver Flag',
      status: fp.automation.webdriver ? 'fail' : 'pass',
      value: fp.automation.webdriver ? 'Detected' : 'Not detected',
      message: fp.automation.webdriver ? 'navigator.webdriver is true' : null,
    },
    {
      id: 'chrome-runtime',
      name: 'Chrome Runtime',
      status: fp.automation.chromeRuntime ? 'pass' : 'warn',
      value: fp.automation.chromeRuntime ? 'Present' : 'Missing',
      message: !fp.automation.chromeRuntime ? 'Chrome runtime missing (headless indicator)' : null,
    },
    {
      id: 'cdp-traces',
      name: 'CDP Traces',
      status: fp.automation.cdpTraces ? 'fail' : 'pass',
      value: fp.automation.cdpTraces ? 'Detected' : 'Not detected',
      message: fp.automation.cdpTraces ? 'Chrome DevTools Protocol traces found' : null,
    },
    {
      id: 'selenium',
      name: 'Selenium',
      status: fp.automation.selenium ? 'fail' : 'pass',
      value: fp.automation.selenium ? 'Detected' : 'Not detected',
      message: fp.automation.selenium ? 'Selenium variables detected' : null,
    },
  ];

  const score = calculateLayerScore(checks);
  return { score, checks, status: score >= 80 ? 'pass' : score >= 50 ? 'warn' : 'fail' };
}

function runConsistencyChecks(fp: FingerprintData, ipInfo: any, ja3Hash: string | null) {
  const checks = [];

  // GPU vs OS check
  const hasAppleGPU = fp.webgl.renderer.includes('Apple');
  const claimsWindows = fp.navigator.userAgent.includes('Windows');
  checks.push({
    id: 'gpu-os-mismatch',
    name: 'GPU/OS Consistency',
    passed: !(hasAppleGPU && claimsWindows),
    severity: 'critical',
    penalty: 20,
    message: hasAppleGPU && claimsWindows ? 'Apple GPU cannot run Windows natively' : null,
  });

  // Platform vs UA check
  const platform = fp.navigator.platform;
  const ua = fp.navigator.userAgent;
  const platformUaMismatch =
    (platform === 'Win32' && ua.includes('Mac OS X')) ||
    (platform === 'MacIntel' && ua.includes('Windows'));
  checks.push({
    id: 'platform-ua-mismatch',
    name: 'Platform/UA Consistency',
    passed: !platformUaMismatch,
    severity: 'critical',
    penalty: 20,
    message: platformUaMismatch ? 'Platform contradicts User-Agent' : null,
  });

  // Touch vs device type
  const isMobile = /Mobile|Android|iPhone/.test(ua);
  const touchMismatch = isMobile && fp.navigator.maxTouchPoints === 0;
  checks.push({
    id: 'touch-mismatch',
    name: 'Touch/Device Consistency',
    passed: !touchMismatch,
    severity: 'warning',
    penalty: 5,
    message: touchMismatch ? 'Mobile device reports no touch support' : null,
  });

  return checks;
}

function calculateLayerScore(checks: any[]): number {
  let score = 100;
  for (const check of checks) {
    if (check.status === 'fail') {
      score -= 25;
    } else if (check.status === 'warn') {
      score -= 10;
    }
  }
  return Math.max(0, score);
}

function scoreToGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

function checkTimezoneCountryMatch(timezone: string, country: string): boolean {
  // Simplified check - in production, use a proper timezone/country database
  const tzCountryMap: Record<string, string[]> = {
    US: ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Phoenix'],
    GB: ['Europe/London'],
    DE: ['Europe/Berlin'],
    FR: ['Europe/Paris'],
    JP: ['Asia/Tokyo'],
    CN: ['Asia/Shanghai'],
    // Add more mappings...
  };

  const expectedTimezones = tzCountryMap[country] || [];
  return expectedTimezones.length === 0 || expectedTimezones.includes(timezone);
}

function generateRecommendations(criticalIssues: any[], warnings: any[]): string[] {
  const recommendations: string[] = [];

  for (const issue of criticalIssues) {
    if (issue.check === 'webrtc-leak') {
      recommendations.push('Disable WebRTC or use a browser extension to prevent IP leaks');
    }
    if (issue.check === 'webdriver') {
      recommendations.push('Use an anti-detect browser to mask automation flags');
    }
    if (issue.check === 'gpu-os-mismatch' || issue.check === 'platform-ua-mismatch') {
      recommendations.push('Use Mutilogin or similar to create consistent fingerprints');
    }
  }

  if (recommendations.length === 0 && warnings.length > 0) {
    recommendations.push('Consider using an anti-detect browser for optimal fingerprint consistency');
  }

  return recommendations;
}

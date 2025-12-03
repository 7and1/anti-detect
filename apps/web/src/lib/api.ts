const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.anti-detect.com';

export interface ScanSession {
  sessionId: string;
  ipInfo: {
    ip: string;
    country: string;
    city: string;
    region: string;
    timezone: string;
    asn: number;
    asOrganization: string;
  };
  tlsFingerprint: {
    ja3: string | null;
    ja4: string | null;
  };
}

export interface ScanResult {
  sessionId: string;
  trustScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  layers: Record<string, LayerResult>;
  consistencyChecks: ConsistencyCheck[];
  criticalIssues: Issue[];
  warnings: Issue[];
  recommendations: string[];
}

export interface LayerResult {
  score: number;
  checks: Check[];
  status: 'pass' | 'warn' | 'fail';
}

export interface Check {
  id: string;
  name: string;
  status: 'pass' | 'warn' | 'fail';
  value: string | number | boolean;
  message?: string;
}

export interface ConsistencyCheck {
  id: string;
  name: string;
  passed: boolean;
  severity: 'critical' | 'warning' | 'info';
  penalty: number;
  message: string | null;
}

export interface Issue {
  layer: string;
  check: string;
  message: string;
}

export interface GeneratedFingerprint {
  id: number;
  hash: string;
  userAgent: string;
  platform: string;
  screen: {
    width: number;
    height: number;
    devicePixelRatio: number;
  };
  hardware: {
    hardwareConcurrency: number;
    deviceMemory: number;
    maxTouchPoints: number;
  };
  webgl: {
    vendor: string;
    renderer: string;
  };
  locale: {
    timezone: string;
    languages: string[];
  };
  fonts: string[];
  metadata: {
    qualityScore: number;
    os: string;
    browser: string;
  };
}

export interface IPCheckResult {
  ip: string;
  country: string;
  countryCode: string;
  city: string;
  timezone: string;
  asn: number;
  asOrganization: string;
  ipType: string;
  isProxy: boolean;
  isVPN: boolean;
  isTor: boolean;
  isResidential: boolean;
  riskScore: number;
  blacklistStatus: {
    listed: boolean;
    lists: string[];
  };
}

// Scan API
export async function startScan(): Promise<ScanSession> {
  const response = await fetch(`${API_BASE}/scan/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to start scan');
  }

  return response.json();
}

export async function submitFingerprint(
  sessionId: string,
  fingerprint: Record<string, unknown>
): Promise<ScanResult> {
  const response = await fetch(`${API_BASE}/scan/collect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sessionId, fingerprint }),
  });

  if (!response.ok) {
    throw new Error('Failed to submit fingerprint');
  }

  return response.json();
}

// Generator API
export async function generateFingerprint(options?: {
  os?: string;
  browser?: string;
  quality?: 'standard' | 'premium' | 'verified';
}): Promise<{ fingerprint: GeneratedFingerprint }> {
  const params = new URLSearchParams();
  if (options?.os) params.set('os', options.os);
  if (options?.browser) params.set('browser', options.browser);
  if (options?.quality) params.set('quality', options.quality);

  const response = await fetch(`${API_BASE}/generate?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to generate fingerprint');
  }

  return response.json();
}

export async function exportFingerprint(
  format: 'json' | 'puppeteer' | 'playwright' | 'selenium' | 'mutilogin',
  options?: {
    os?: string;
    browser?: string;
    quality?: string;
  }
): Promise<{ format: string; code: string }> {
  const params = new URLSearchParams();
  if (options?.os) params.set('os', options.os);
  if (options?.browser) params.set('browser', options.browser);
  if (options?.quality) params.set('quality', options.quality);

  const response = await fetch(`${API_BASE}/generate/export/${format}?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to export fingerprint');
  }

  return response.json();
}

// Report API
export async function createReport(scanData: ScanResult): Promise<{
  reportId: string;
  url: string;
  shareLinks: { twitter: string; reddit: string; copy: string };
}> {
  const response = await fetch(`${API_BASE}/report/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      scanData: {
        trustScore: scanData.trustScore,
        grade: scanData.grade,
        layers: scanData.layers,
        criticalIssues: scanData.criticalIssues,
        warnings: scanData.warnings,
        recommendations: scanData.recommendations,
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create report');
  }

  return response.json();
}

export async function getReport(reportId: string): Promise<{
  reportId: string;
  trustScore: number;
  grade: string;
  createdAt: string;
  expiresAt: string;
  viewCount: number;
  scanData: {
    layers: Record<string, LayerResult>;
    criticalIssues: Issue[];
    warnings: Issue[];
    recommendations: string[];
  };
}> {
  const response = await fetch(`${API_BASE}/report/${reportId}`);

  if (!response.ok) {
    throw new Error('Report not found');
  }

  return response.json();
}

// IP Check API
export async function checkIP(): Promise<IPCheckResult> {
  const response = await fetch(`${API_BASE}/ip/check`);

  if (!response.ok) {
    throw new Error('Failed to check IP');
  }

  return response.json();
}

// Challenge API
export async function startChallenge(): Promise<{
  sessionId: string;
  levels: { level: number; name: string; points: number }[];
}> {
  const response = await fetch(`${API_BASE}/challenge/start`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to start challenge');
  }

  return response.json();
}

export async function submitChallengeLevel(
  sessionId: string,
  level: number,
  checks: { id: string; passed: boolean; value?: unknown }[]
): Promise<{
  level: number;
  passed: boolean;
  score: number;
  maxScore: number;
  totalScore: number;
  nextLevel: number | null;
}> {
  const response = await fetch(`${API_BASE}/challenge/level/${level}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sessionId, checks }),
  });

  if (!response.ok) {
    throw new Error('Failed to submit challenge level');
  }

  return response.json();
}

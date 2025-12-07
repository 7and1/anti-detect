import type { ScoringWeights } from '@anti-detect/consistency';
import type {
  AutomationTaskDTO,
  AutomationTaskRunDTO,
  WebhookSubscriptionDTO,
  WebhookDeliveryDTO,
  AutomationTarget,
  AutomationSchedule,
  AutomationCadence,
} from '@anti-detect/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.anti-detect.com';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

const withApiHeaders = (headers: HeadersInit = {}): HeadersInit => {
  const merged: Record<string, string> = {
    ...(typeof headers === 'object' ? (headers as Record<string, string>) : {}),
  };
  if (API_KEY) {
    merged['x-api-key'] = API_KEY;
  }
  return merged;
};

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
  profileId?: string;
  metadata?: Record<string, unknown>;
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

export interface ScoringProfileDTO {
  id: string;
  slug: string;
  name: string;
  description?: string;
  useCase?: string;
  weights: ScoringWeights;
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
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
    headers: withApiHeaders({
      'Content-Type': 'application/json',
    }),
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
    headers: withApiHeaders({
      'Content-Type': 'application/json',
    }),
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
    headers: withApiHeaders({
      'Content-Type': 'application/json',
    }),
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
    headers: withApiHeaders({
      'Content-Type': 'application/json',
    }),
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
    headers: withApiHeaders({
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify({
      scanData: {
        trustScore: scanData.trustScore,
        grade: scanData.grade,
        layers: scanData.layers,
        criticalIssues: scanData.criticalIssues,
        warnings: scanData.warnings,
        recommendations: scanData.recommendations,
        clientId: scanData.sessionId,
        metadata: {
          ...(scanData.metadata || {}),
          profileId: scanData.profileId,
        },
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
  const response = await fetch(`${API_BASE}/report/${reportId}`, {
    headers: withApiHeaders(),
  });

  if (!response.ok) {
    throw new Error('Report not found');
  }

  return response.json();
}

// Scoring profile API
export async function listScoringProfiles(): Promise<ScoringProfileDTO[]> {
  const response = await fetch(`${API_BASE}/score/profiles`, {
    headers: withApiHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to load scoring profiles');
  }
  const data = await response.json();
  return data.profiles ?? [];
}

export async function createScoringProfile(payload: Partial<ScoringProfileDTO>): Promise<ScoringProfileDTO> {
  const response = await fetch(`${API_BASE}/score/profiles`, {
    method: 'POST',
    headers: withApiHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error('Failed to create profile');
  }
  return response.json();
}

export async function updateScoringProfile(
  id: string,
  payload: Partial<ScoringProfileDTO>
): Promise<ScoringProfileDTO> {
  const response = await fetch(`${API_BASE}/score/profiles/${id}`, {
    method: 'PUT',
    headers: withApiHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error('Failed to update profile');
  }
  return response.json();
}

export async function deleteScoringProfile(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/score/profiles/${id}`, {
    method: 'DELETE',
    headers: withApiHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to delete profile');
  }
}

// IP Check API
export async function checkIP(): Promise<IPCheckResult> {
  const response = await fetch(`${API_BASE}/ip/check`, {
    headers: withApiHeaders(),
  });

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
    headers: withApiHeaders(),
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
    headers: withApiHeaders({
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify({ sessionId, checks }),
  });

  if (!response.ok) {
    throw new Error('Failed to submit challenge level');
  }

  return response.json();
}

// Automation API
export async function listAutomationTasks(limit = 25): Promise<AutomationTaskDTO[]> {
  const response = await fetch(`${API_BASE}/tasks?limit=${limit}`, {
    cache: 'no-store',
    headers: withApiHeaders(),
  });
  if (!response.ok) {
    throw new Error((await extractApiError(response)) || 'Failed to load automation tasks');
  }
  const data = await response.json();
  return data.tasks ?? [];
}

export async function getAutomationTask(taskId: string): Promise<{
  task: AutomationTaskDTO;
  runs: AutomationTaskRunDTO[];
}> {
  const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
    headers: withApiHeaders(),
  });
  if (!response.ok) {
    throw new Error('Automation task not found');
  }
  return response.json();
}

export async function createAutomationTask(payload: CreateAutomationTaskRequest): Promise<AutomationTaskDTO> {
  const response = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: withApiHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error((await extractApiError(response)) || 'Failed to create automation task');
  }
  return response.json();
}

export async function triggerAutomationTask(taskId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/tasks/${taskId}/trigger`, {
    method: 'POST',
    headers: withApiHeaders(),
  });
  if (!response.ok) {
    throw new Error((await extractApiError(response)) || 'Unable to enqueue task');
  }
}

// Webhooks API
export async function listWebhookSubscriptions(projectId?: string): Promise<WebhookSubscriptionDTO[]> {
  const params = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
  const response = await fetch(`${API_BASE}/webhooks${params}`, {
    headers: withApiHeaders(),
  });
  if (!response.ok) {
    throw new Error((await extractApiError(response)) || 'Failed to load webhooks');
  }
  const data = await response.json();
  return data.webhooks ?? [];
}

export async function createWebhookSubscription(payload: CreateWebhookRequest): Promise<WebhookSubscriptionDTO> {
  const response = await fetch(`${API_BASE}/webhooks`, {
    method: 'POST',
    headers: withApiHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error((await extractApiError(response)) || 'Failed to create webhook');
  }
  return response.json();
}

export async function testWebhookSubscription(id: string): Promise<WebhookDeliveryDTO> {
  const response = await fetch(`${API_BASE}/webhooks/${id}/test`, {
    method: 'POST',
    headers: withApiHeaders(),
  });
  if (!response.ok) {
    throw new Error((await extractApiError(response)) || 'Unable to trigger webhook');
  }
  const data = await response.json();
  return data.delivery;
}

export async function testAdhocWebhook(payload: WebhookTestRequest): Promise<{
  ok: boolean;
  status: number;
  error?: string;
}> {
  const response = await fetch(`${API_BASE}/webhooks/test`, {
    method: 'POST',
    headers: withApiHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error((await extractApiError(response)) || 'Unable to send webhook test');
  }
  return response.json();
}

// Types for callers
export interface CreateAutomationTaskRequest {
  name: string;
  projectId?: string;
  cadence: AutomationCadence;
  timezone?: string;
  schedule?: AutomationSchedule;
  targets: AutomationTarget[];
  webhook?: {
    url: string;
    secret?: string;
  };
  activate?: boolean;
}

export interface CreateWebhookRequest {
  name: string;
  projectId?: string;
  url: string;
  events: string[];
  secret?: string;
  status?: 'active' | 'paused';
}

export interface WebhookTestRequest {
  url: string;
  secret?: string;
  projectId?: string;
}

async function extractApiError(response: Response): Promise<string | null> {
  try {
    const data = await response.clone().json();
    if (typeof data?.error === 'string') {
      return data.error;
    }
  } catch {
    // Ignore body parsing failures and fall back to status text
  }
  return response.statusText || null;
}

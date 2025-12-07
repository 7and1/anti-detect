import type { D1Database } from '@cloudflare/workers-types';
import { sha256 } from '../lib/hash';

type LayerMap = Record<string, { score?: number } & Record<string, unknown>>;

type SessionRow = {
  id: string;
  client_id: string;
  report_id: string;
  fingerprint_hash: string;
  trust_score: number;
  issues_count: number;
  warnings_count: number;
  layer_scores: string;
  recommendations: string | null;
  created_at: number;
  metadata: string | null;
};

export interface SessionHistoryEntry {
  sessionId: string;
  reportId: string;
  clientId: string;
  trustScore: number;
  createdAt: number;
  issuesCount: number;
  warningsCount: number;
  fingerprintHash: string;
  deltas: {
    score: number;
    issues: number;
    warnings: number;
    fingerprintChanged: boolean;
  };
  layerChanges: Array<{
    layer: string;
    delta: number;
    current: number;
  }>;
}

interface RecordPayload {
  clientId: string;
  reportId: string;
  trustScore: number;
  issuesCount: number;
  warningsCount: number;
  layers: LayerMap;
  recommendations?: string[];
  metadata?: Record<string, unknown>;
  fingerprintHash?: string;
}

export async function recordFingerprintSession(
  db: D1Database,
  payload: RecordPayload
): Promise<string> {
  const sessionId = crypto.randomUUID();
  const fingerprintHash =
    payload.fingerprintHash || (await sha256(JSON.stringify(payload.layers)));

  await db
    .prepare(`
      INSERT OR REPLACE INTO fingerprint_sessions
        (id, client_id, report_id, fingerprint_hash, trust_score, issues_count, warnings_count, layer_scores, recommendations, created_at, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      sessionId,
      payload.clientId,
      payload.reportId,
      fingerprintHash,
      payload.trustScore,
      payload.issuesCount,
      payload.warningsCount,
      JSON.stringify(payload.layers || {}),
      JSON.stringify(payload.recommendations || []),
      Date.now(),
      JSON.stringify(payload.metadata || {})
    )
    .run();

  return sessionId;
}

export async function getSessionHistory(
  db: D1Database,
  clientId: string,
  limit: number
): Promise<SessionHistoryEntry[]> {
  const { results } = await db
    .prepare(
      `SELECT * FROM fingerprint_sessions WHERE client_id = ? ORDER BY created_at DESC LIMIT ?`
    )
    .bind(clientId, limit)
    .all<SessionRow>();

  if (!results || results.length === 0) {
    return [];
  }

  const entries: SessionHistoryEntry[] = [];

  for (let i = 0; i < results.length; i++) {
    const row = results[i];
    const next = results[i + 1];
    const currentLayers: LayerMap = JSON.parse(row.layer_scores || '{}');
    const nextLayers: LayerMap | null = next ? JSON.parse(next.layer_scores || '{}') : null;

    const layerChanges: SessionHistoryEntry['layerChanges'] = [];

    if (nextLayers) {
      for (const [layer, layerResult] of Object.entries(currentLayers)) {
        const currentScore = typeof layerResult === 'object' && layerResult !== null && 'score' in layerResult ? Number((layerResult as any).score ?? 0) : 0;
        const previousScore = typeof nextLayers[layer] === 'object' && nextLayers[layer] !== null && 'score' in nextLayers[layer] ? Number((nextLayers[layer] as any).score ?? 0) : 0;
        const delta = currentScore - previousScore;
        if (delta !== 0) {
          layerChanges.push({ layer, delta, current: currentScore });
        }
      }
    }

    entries.push({
      sessionId: row.id,
      reportId: row.report_id,
      clientId: row.client_id,
      trustScore: row.trust_score,
      createdAt: row.created_at,
      issuesCount: row.issues_count,
      warningsCount: row.warnings_count,
      fingerprintHash: row.fingerprint_hash,
      deltas: {
        score: next ? row.trust_score - next.trust_score : 0,
        issues: next ? row.issues_count - next.issues_count : 0,
        warnings: next ? row.warnings_count - next.warnings_count : 0,
        fingerprintChanged: next ? row.fingerprint_hash !== next.fingerprint_hash : false,
      },
      layerChanges,
    });
  }

  return entries;
}

export async function getSessionDiff(
  db: D1Database,
  clientId: string,
  baselineId: string,
  targetId: string
) {
  const { results } = await db
    .prepare(
      `SELECT * FROM fingerprint_sessions WHERE client_id = ? AND id IN (?, ?)`
    )
    .bind(clientId, baselineId, targetId)
    .all<SessionRow>();

  if (!results || results.length < 2) {
    return null;
  }

  const baseline = results.find((row) => row.id === baselineId)!;
  const target = results.find((row) => row.id === targetId)!;

  const baselineLayers: LayerMap = JSON.parse(baseline.layer_scores || '{}');
  const targetLayers: LayerMap = JSON.parse(target.layer_scores || '{}');

  const changedLayers = new Array<{ layer: string; from: number; to: number }>();

  const layerKeys = new Set([...Object.keys(baselineLayers), ...Object.keys(targetLayers)]);
  for (const layer of layerKeys) {
    const fromVal = typeof baselineLayers[layer] === 'object' && baselineLayers[layer] !== null && 'score' in baselineLayers[layer]
      ? Number((baselineLayers[layer] as any).score ?? 0)
      : 0;
    const toVal = typeof targetLayers[layer] === 'object' && targetLayers[layer] !== null && 'score' in targetLayers[layer]
      ? Number((targetLayers[layer] as any).score ?? 0)
      : 0;

    if (fromVal !== toVal) {
      changedLayers.push({ layer, from: fromVal, to: toVal });
    }
  }

  return {
    clientId,
    baseline: {
      sessionId: baseline.id,
      reportId: baseline.report_id,
      trustScore: baseline.trust_score,
      createdAt: baseline.created_at,
    },
    target: {
      sessionId: target.id,
      reportId: target.report_id,
      trustScore: target.trust_score,
      createdAt: target.created_at,
    },
    deltaScore: target.trust_score - baseline.trust_score,
    changedLayers,
    fingerprintChanged: baseline.fingerprint_hash !== target.fingerprint_hash,
  };
}

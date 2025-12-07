import type {
  AutomationCadence,
  AutomationSchedule,
  AutomationTarget,
  AutomationTaskDTO,
  AutomationTaskRunDTO,
} from '@anti-detect/types';

export interface AutomationTaskRow {
  id: string;
  name: string;
  project_id: string | null;
  status: AutomationTaskDTO['status'];
  cadence: AutomationCadence;
  timezone: string;
  schedule: string | null;
  targets: string;
  last_run_at: number | null;
  next_run_at: number | null;
  last_status: string | null;
  webhook_url: string | null;
  webhook_secret: string | null;
  retry_limit: number;
  created_at: number;
  updated_at: number;
  metadata: string | null;
  last_result: string | null;
}

export interface AutomationTaskRunRow {
  id: string;
  task_id: string;
  status: AutomationTaskRunDTO['status'];
  queued_at: number;
  started_at: number | null;
  completed_at: number | null;
  duration_ms: number | null;
  batches_processed: number | null;
  success_count: number | null;
  fail_count: number | null;
  webhook_status: string | null;
  response_code: number | null;
  error: string | null;
  sample_report_id: string | null;
  metadata: string | null;
}

export interface QueuePayload {
  runId: string;
  taskId: string;
  enqueuedAt: number;
  attempts: number;
  projectId: string | null;
  directWebhook?: {
    url: string | null;
    secret?: string | null;
  } | null;
}

export const QUEUE_PREFIX = 'automation:queue:';
const MINUTE = 60 * 1000;

export function parseSchedule(raw: string | null): AutomationSchedule | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AutomationSchedule;
    return parsed;
  } catch {
    return null;
  }
}

export function parseTargets(raw: string | null): AutomationTarget[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as AutomationTarget[];
    }
    return [];
  } catch {
    return [];
  }
}

export function mapTaskRow(row: AutomationTaskRow): AutomationTaskDTO {
  return {
    id: row.id,
    name: row.name,
    projectId: row.project_id,
    status: row.status,
    cadence: row.cadence,
    timezone: row.timezone,
    schedule: parseSchedule(row.schedule),
    targets: parseTargets(row.targets),
    lastRunAt: row.last_run_at,
    nextRunAt: row.next_run_at,
    lastStatus: row.last_status,
    retryLimit: row.retry_limit,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastResult: safeParse<Record<string, unknown>>(row.last_result),
    webhookUrl: row.webhook_url,
    webhookSecret: row.webhook_secret,
  };
}

export function mapRunRow(row: AutomationTaskRunRow): AutomationTaskRunDTO {
  return {
    id: row.id,
    taskId: row.task_id,
    status: row.status,
    queuedAt: row.queued_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    durationMs: row.duration_ms,
    batchesProcessed: row.batches_processed,
    successCount: row.success_count,
    failCount: row.fail_count,
    webhookStatus: row.webhook_status,
    responseCode: row.response_code,
    error: row.error,
    sampleReportId: row.sample_report_id,
    metadata: safeParse<Record<string, unknown>>(row.metadata),
  };
}

export function computeNextRun(
  cadence: AutomationCadence,
  schedule: AutomationSchedule | null,
  now: number = Date.now()
): number | null {
  if (cadence === 'manual') {
    return null;
  }

  const config = schedule || {};

  if (cadence === 'interval') {
    const minutes = Math.max(5, config.intervalMinutes ?? 60);
    return now + minutes * MINUTE;
  }

  if (cadence === 'hourly') {
    return now + MINUTE * 60;
  }

  if (cadence === 'daily') {
    const dailyTime = config.dailyTime ?? '00:00';
    const [h, m] = dailyTime.split(':').map((value) => Number(value) || 0);
    const timezone = config.timezone || 'UTC';
    const base = new Date(now);
    const tzOffset = getTimezoneOffsetMs(timezone, base);
    const utcCandidate = new Date(now + tzOffset);
    utcCandidate.setUTCHours(h, m, 0, 0);
    let candidate = utcCandidate.getTime() - tzOffset;
    if (candidate <= now) {
      candidate += 24 * 60 * MINUTE;
    }
    return candidate;
  }

  if (cadence === 'cron') {
    const cronExpr = config.cron ?? '*/60 * * * *';
    const intervalMatch = cronExpr.match(/^\*\/(\d+)\s/);
    if (intervalMatch) {
      const minutes = Math.max(1, Number(intervalMatch[1]));
      return now + minutes * MINUTE;
    }
    if (cronExpr === '0 * * * *') {
      return now + MINUTE * 60;
    }
    if (cronExpr === '0 0 * * *') {
      return now + 24 * 60 * MINUTE;
    }
    return now + (config.intervalMinutes ?? 60) * MINUTE;
  }

  // Default fallback
  return now + MINUTE * 60;
}

export function buildQueueKey(runId: string, timestamp: number = Date.now()): string {
  return `${QUEUE_PREFIX}${timestamp}:${runId}`;
}

export function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function getTimezoneOffsetMs(timeZone: string, date: Date): number {
  try {
    const localeString = date.toLocaleString('en-US', { timeZone });
    const localDate = new Date(localeString);
    return localDate.getTime() - date.getTime();
  } catch {
    return 0;
  }
}

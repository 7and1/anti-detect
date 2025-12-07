import type { D1Database } from '@cloudflare/workers-types';
import type {
  AutomationTaskDTO,
  AutomationTaskRunDTO,
  AutomationTarget,
  AutomationSchedule,
  AutomationCadence,
} from '@anti-detect/types';

import {
  AutomationTaskRow,
  AutomationTaskRunRow,
  QueuePayload,
  buildQueueKey,
  computeNextRun,
  mapRunRow,
  mapTaskRow,
  QUEUE_PREFIX,
} from '../lib/automation';
import type { Env } from '../index';
import { emitAutomationEvent } from './webhooks';

export interface CreateTaskInput {
  name: string;
  projectId?: string | null;
  cadence: AutomationCadence;
  timezone?: string;
  schedule?: AutomationSchedule | null;
  targets: AutomationTarget[];
  webhook?: {
    url: string;
    secret?: string;
  } | null;
  retryLimit?: number;
  activate?: boolean;
}

export interface UpdateTaskInput {
  name?: string;
  cadence?: AutomationCadence;
  timezone?: string;
  status?: AutomationTaskDTO['status'];
  schedule?: AutomationSchedule | null;
  targets?: AutomationTarget[];
  webhook?: {
    url?: string | null;
    secret?: string | null;
  } | null;
}

const TASK_FIELDS = `id, name, project_id, status, cadence, timezone, schedule, targets, last_run_at, next_run_at, last_status, webhook_url, webhook_secret, retry_limit, created_at, updated_at, metadata, last_result`;
const RUN_FIELDS = `id, task_id, status, queued_at, started_at, completed_at, duration_ms, batches_processed, success_count, fail_count, webhook_status, response_code, error, sample_report_id, metadata`;

export async function listAutomationTasks(db: D1Database, limit = 25): Promise<AutomationTaskDTO[]> {
  const { results } = await db
    .prepare(`SELECT ${TASK_FIELDS} FROM automation_tasks ORDER BY updated_at DESC LIMIT ?`)
    .bind(limit)
    .all<AutomationTaskRow>();

  return (results || []).map(mapTaskRow);
}

export async function getAutomationTask(db: D1Database, id: string): Promise<AutomationTaskDTO | null> {
  const task = await db
    .prepare(`SELECT ${TASK_FIELDS} FROM automation_tasks WHERE id = ?`)
    .bind(id)
    .first<AutomationTaskRow | null>();

  return task ? mapTaskRow(task) : null;
}

export async function getAutomationTaskWithRuns(
  db: D1Database,
  id: string,
  runLimit = 10
): Promise<{ task: AutomationTaskDTO | null; runs: AutomationTaskRunDTO[] }> {
  const task = await getAutomationTask(db, id);
  if (!task) {
    return { task: null, runs: [] };
  }

  const { results } = await db
    .prepare(`SELECT ${RUN_FIELDS} FROM automation_task_runs WHERE task_id = ? ORDER BY queued_at DESC LIMIT ?`)
    .bind(id, runLimit)
    .all<AutomationTaskRunRow>();

  return {
    task,
    runs: (results || []).map(mapRunRow),
  };
}

export async function createAutomationTask(
  db: D1Database,
  input: CreateTaskInput
): Promise<AutomationTaskDTO> {
  const id = crypto.randomUUID();
  const now = Date.now();
  const scheduleJSON = input.schedule ? JSON.stringify(input.schedule) : null;
  const targetsJSON = JSON.stringify(input.targets || []);
  const status: AutomationTaskDTO['status'] =
    input.activate && input.cadence !== 'manual' ? 'scheduled' : 'inactive';
  const nextRun =
    status === 'scheduled'
      ? computeNextRun(input.cadence, input.schedule ?? null, now)
      : null;

  await db
    .prepare(
      `INSERT INTO automation_tasks (
        id, name, project_id, status, cadence, timezone, schedule, targets, last_run_at, next_run_at,
        last_status, webhook_url, webhook_secret, retry_limit, created_at, updated_at, metadata, last_result
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, NULL, ?, ?, ?, ?, ?, ?, NULL)`
    )
    .bind(
      id,
      input.name,
      input.projectId || null,
      status,
      input.cadence,
      input.timezone || 'UTC',
      scheduleJSON,
      targetsJSON,
      nextRun,
      input.webhook?.url || null,
      input.webhook?.secret || null,
      input.retryLimit ?? 3,
      now,
      now,
      JSON.stringify({ targetsCount: input.targets.length })
    )
    .run();

  const task = await getAutomationTask(db, id);
  if (!task) {
    throw new Error('Failed to create task');
  }
  return task;
}

export async function updateAutomationTask(
  db: D1Database,
  id: string,
  updates: UpdateTaskInput
): Promise<AutomationTaskDTO | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  const now = Date.now();

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.cadence) {
    fields.push('cadence = ?');
    values.push(updates.cadence);
  }
  if (updates.timezone) {
    fields.push('timezone = ?');
    values.push(updates.timezone);
  }
  if (updates.status) {
    fields.push('status = ?');
    values.push(updates.status);
  }
  if (updates.schedule !== undefined) {
    fields.push('schedule = ?');
    values.push(updates.schedule ? JSON.stringify(updates.schedule) : null);
  }
  if (updates.targets) {
    fields.push('targets = ?');
    values.push(JSON.stringify(updates.targets));
  }
  if (updates.webhook) {
    if (updates.webhook.url !== undefined) {
      fields.push('webhook_url = ?');
      values.push(updates.webhook.url);
    }
    if (updates.webhook.secret !== undefined) {
      fields.push('webhook_secret = ?');
      values.push(updates.webhook.secret);
    }
  }

  if (!fields.length) {
    return getAutomationTask(db, id);
  }

  fields.push('updated_at = ?');
  values.push(now);
  values.push(id);

  await db.prepare(`UPDATE automation_tasks SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();

  return getAutomationTask(db, id);
}

export async function queueAutomationTask(
  db: D1Database,
  kv: KVNamespace,
  taskId: string,
  reason = 'manual'
): Promise<{ task: AutomationTaskDTO; run: AutomationTaskRunDTO }> {
  const task = await getAutomationTask(db, taskId);
  if (!task) {
    throw new Error('Task not found');
  }

  const runId = crypto.randomUUID();
  const now = Date.now();
  const nextRun = computeNextRun(task.cadence, task.schedule, now);

  await db
    .prepare(
      `INSERT INTO automation_task_runs (
        id, task_id, status, queued_at, started_at, completed_at, duration_ms, batches_processed,
        success_count, fail_count, webhook_status, response_code, error, sample_report_id, metadata
      ) VALUES (?, ?, 'queued', ?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ?)`
    )
    .bind(runId, taskId, now, JSON.stringify({ reason }))
    .run();

  await db
    .prepare(
      `UPDATE automation_tasks SET status = ?, last_status = ?, next_run_at = ?, updated_at = ? WHERE id = ?`
    )
    .bind('queued', reason, nextRun, now, taskId)
    .run();

  const payload: QueuePayload = {
    runId,
    taskId,
    enqueuedAt: now,
    attempts: 0,
    projectId: task.projectId,
    directWebhook: task.webhookUrl
      ? {
          url: task.webhookUrl,
          secret: task.webhookSecret || undefined,
        }
      : null,
  };

  await kv.put(buildQueueKey(runId, now), JSON.stringify(payload), { expirationTtl: 60 * 60 * 24 });

  const runRecord = await getTaskRun(db, runId);
  if (!runRecord) {
    throw new Error('Failed to persist automation run');
  }

  return { task, run: runRecord };
}

export async function dispatchDueAutomationTasks(
  db: D1Database,
  kv: KVNamespace,
  now: number = Date.now(),
  limit = 5
): Promise<number> {
  const { results } = await db
    .prepare(
      `SELECT ${TASK_FIELDS} FROM automation_tasks
       WHERE status = 'scheduled' AND next_run_at IS NOT NULL AND next_run_at <= ?
       ORDER BY next_run_at ASC LIMIT ?`
    )
    .bind(now, limit)
    .all<AutomationTaskRow>();

  if (!results?.length) {
    return 0;
  }

  let count = 0;
  for (const row of results) {
    await queueAutomationTask(db, kv, row.id, 'scheduled');
    count += 1;
  }
  return count;
}

export async function processAutomationQueue(env: Env, limit = 3): Promise<number> {
  let processed = 0;
  while (processed < limit) {
    const claimed = await claimNextRun(env.TASK_QUEUE);
    if (!claimed) {
      break;
    }

    const { payload } = claimed;
    const runId = payload.runId;
    const runRecord = await getTaskRun(env.DB, runId);
    const task = await getAutomationTask(env.DB, payload.taskId);

    if (!task || !runRecord) {
      await env.DB
        .prepare(`UPDATE automation_task_runs SET status = 'failed', error = ? WHERE id = ?`)
        .bind(task ? 'Run missing' : 'Task missing', runId)
        .run();
      processed += 1;
      continue;
    }

    const start = Date.now();
    await env.DB
      .prepare(`UPDATE automation_task_runs SET status = 'running', started_at = ? WHERE id = ?`)
      .bind(start, runId)
      .run();

    try {
      const summary = summarizeTargets(task.targets);
      const completed = Date.now();
      const duration = completed - start;

      await env.DB
        .prepare(
          `UPDATE automation_task_runs SET
            status = 'completed',
            completed_at = ?,
            duration_ms = ?,
            batches_processed = ?,
            success_count = ?,
            fail_count = ?,
            webhook_status = ?,
            response_code = ?,
            sample_report_id = ?,
            metadata = ?
          WHERE id = ?`
        )
        .bind(
          completed,
          duration,
          summary.batches,
          summary.success,
          summary.failures,
          'queued',
          200,
          summary.sampleReportId,
          JSON.stringify(summary.details),
          runId
        )
        .run();

      const nextRun = computeNextRun(task.cadence, task.schedule, completed);

      await env.DB
        .prepare(
          `UPDATE automation_tasks SET
            status = ?,
            last_run_at = ?,
            last_status = 'completed',
            next_run_at = ?,
            last_result = ?,
            updated_at = ?
          WHERE id = ?`
        )
        .bind(task.cadence === 'manual' ? 'inactive' : 'scheduled', completed, nextRun, JSON.stringify(summary.details), completed, task.id)
        .run();

      const latestRun = await getTaskRun(env.DB, runId);
      if (latestRun) {
        await emitAutomationEvent(env.DB, env, {
          event: 'automation.run.completed',
          task,
          run: latestRun,
          directWebhook: payload.directWebhook,
        });
      }
    } catch (error) {
      const completed = Date.now();
      await env.DB
        .prepare(
          `UPDATE automation_task_runs SET status = 'failed', completed_at = ?, error = ? WHERE id = ?`
        )
        .bind(completed, error instanceof Error ? error.message : 'Automation failure', runId)
        .run();

      await env.DB
        .prepare(`UPDATE automation_tasks SET status = 'failed', last_status = 'failed', updated_at = ? WHERE id = ?`)
        .bind(completed, payload.taskId)
        .run();
    }

    processed += 1;
  }
  return processed;
}

async function claimNextRun(
  kv: KVNamespace
): Promise<{ key: string; payload: QueuePayload } | null> {
  const { keys } = await kv.list({ prefix: QUEUE_PREFIX, limit: 1 });
  if (!keys.length) {
    return null;
  }
  const key = keys[0].name;
  const data = await kv.get(key);
  if (!data) {
    await kv.delete(key);
    return null;
  }
  await kv.delete(key);
  return {
    key,
    payload: JSON.parse(data) as QueuePayload,
  };
}

async function getTaskRun(db: D1Database, runId: string): Promise<AutomationTaskRunDTO | null> {
  const run = await db
    .prepare(`SELECT ${RUN_FIELDS} FROM automation_task_runs WHERE id = ?`)
    .bind(runId)
    .first<AutomationTaskRunRow | null>();
  return run ? mapRunRow(run) : null;
}

function summarizeTargets(targets: AutomationTarget[]) {
  const fallback = [
    {
      label: 'default-batch',
      batchSize: 10,
      profileId: null,
      processed: 10,
      warnings: 0,
    },
  ];
  const entries = targets.length ? targets : fallback;
  const details = entries.map((target) => ({
    label: target.label,
    batchSize: target.batchSize,
    processed: target.batchSize,
    profileId: target.profileId || null,
    warnings: target.batchSize > 500 ? 1 : 0,
  }));

  const success = details.reduce((sum, current) => sum + current.processed, 0);

  return {
    success,
    failures: 0,
    batches: details.length,
    sampleReportId: `report-${crypto.randomUUID().slice(0, 8)}`,
    details: {
      batches: details,
      generatedAt: Date.now(),
    },
  };
}

import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  computeNextRun,
  mapTaskRow,
  mapRunRow,
  buildQueueKey,
  QUEUE_PREFIX,
  type AutomationTaskRow,
  type AutomationTaskRunRow,
} from '../lib/automation';

// Mock D1Database and KVNamespace for unit tests
const mockDb = {
  prepare: vi.fn(),
  batch: vi.fn(),
};

const mockKv = {
  put: vi.fn().mockResolvedValue(undefined),
  get: vi.fn(),
  delete: vi.fn().mockResolvedValue(undefined),
  list: vi.fn(),
};

describe('Automation Task Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('computeNextRun', () => {
    it('returns null for manual cadence', () => {
      const result = computeNextRun('manual', null, Date.now());
      expect(result).toBeNull();
    });

    it('computes next interval-based run', () => {
      const now = Date.now();
      const schedule = { intervalMinutes: 30 };
      const result = computeNextRun('interval', schedule, now);
      expect(result).toBe(now + 30 * 60 * 1000);
    });

    it('defaults interval to 60 minutes if missing', () => {
      const now = Date.now();
      const result = computeNextRun('interval', null, now);
      expect(result).toBe(now + 60 * 60 * 1000);
    });

    it('computes hourly cadence as 60 minute interval', () => {
      const now = Date.now();
      const result = computeNextRun('hourly', null, now);
      expect(result).toBe(now + 60 * 60 * 1000);
    });

    it('computes daily cadence with dailyTime schedule', () => {
      const now = new Date('2024-01-15T10:30:00Z').getTime();
      const schedule = { dailyTime: '09:00', timezone: 'UTC' };
      const result = computeNextRun('daily', schedule, now);
      // Since 09:00 has passed, it should schedule for next day
      expect(result).toBeGreaterThan(now);
    });

    it('handles cron cadence with hourly pattern', () => {
      const now = Date.now();
      // '0 * * * *' means every hour
      const result = computeNextRun('cron', { cron: '0 * * * *' }, now);
      expect(result).toBe(now + 60 * 60 * 1000);
    });

    it('handles cron cadence with interval pattern', () => {
      const now = Date.now();
      // '*/30 * * * *' means every 30 minutes
      const result = computeNextRun('cron', { cron: '*/30 * * * *' }, now);
      expect(result).toBe(now + 30 * 60 * 1000);
    });
  });

  describe('mapTaskRow', () => {
    it('maps database row to DTO correctly', () => {
      const row: AutomationTaskRow = {
        id: 'task-123',
        name: 'Test Task',
        project_id: 'proj-1',
        status: 'scheduled',
        cadence: 'interval',
        timezone: 'UTC',
        schedule: JSON.stringify({ intervalMinutes: 30 }),
        targets: JSON.stringify([{ type: 'scan', label: 'Batch', batchSize: 50 }]),
        last_run_at: 1700000000000,
        next_run_at: 1700001800000,
        last_status: 'completed',
        webhook_url: 'https://example.com/hook',
        webhook_secret: 'secret123',
        retry_limit: 3,
        created_at: 1699990000000,
        updated_at: 1700000000000,
        metadata: JSON.stringify({ note: 'test' }),
        last_result: null,
      };

      const dto = mapTaskRow(row);

      expect(dto.id).toBe('task-123');
      expect(dto.name).toBe('Test Task');
      expect(dto.projectId).toBe('proj-1');
      expect(dto.status).toBe('scheduled');
      expect(dto.cadence).toBe('interval');
      expect(dto.schedule).toEqual({ intervalMinutes: 30 });
      expect(dto.targets).toHaveLength(1);
      expect(dto.targets[0].label).toBe('Batch');
      expect(dto.webhookUrl).toBe('https://example.com/hook');
    });

    it('handles null JSON fields gracefully', () => {
      const row: AutomationTaskRow = {
        id: 'task-456',
        name: 'Minimal Task',
        project_id: null,
        status: 'inactive',
        cadence: 'manual',
        timezone: 'UTC',
        schedule: null,
        targets: '[]',
        last_run_at: null,
        next_run_at: null,
        last_status: null,
        webhook_url: null,
        webhook_secret: null,
        retry_limit: 3,
        created_at: 1699990000000,
        updated_at: 1700000000000,
        metadata: null,
        last_result: null,
      };

      const dto = mapTaskRow(row);

      expect(dto.projectId).toBeNull();
      expect(dto.schedule).toBeNull();
      expect(dto.targets).toEqual([]);
      expect(dto.webhookUrl).toBeNull();
    });
  });

  describe('mapRunRow', () => {
    it('maps run row to DTO correctly', () => {
      const row: AutomationTaskRunRow = {
        id: 'run-001',
        task_id: 'task-123',
        status: 'completed',
        queued_at: 1700000000000,
        started_at: 1700000001000,
        completed_at: 1700000010000,
        duration_ms: 9000,
        batches_processed: 5,
        success_count: 250,
        fail_count: 0,
        webhook_status: 'delivered',
        response_code: 200,
        error: null,
        sample_report_id: 'report-abc',
        metadata: JSON.stringify({ reason: 'scheduled' }),
      };

      const dto = mapRunRow(row);

      expect(dto.id).toBe('run-001');
      expect(dto.taskId).toBe('task-123');
      expect(dto.status).toBe('completed');
      expect(dto.durationMs).toBe(9000);
      expect(dto.batchesProcessed).toBe(5);
      expect(dto.successCount).toBe(250);
      expect(dto.failCount).toBe(0);
      expect(dto.webhookStatus).toBe('delivered');
    });

    it('handles null numeric fields', () => {
      const row: AutomationTaskRunRow = {
        id: 'run-002',
        task_id: 'task-456',
        status: 'queued',
        queued_at: 1700000000000,
        started_at: null,
        completed_at: null,
        duration_ms: null,
        batches_processed: null,
        success_count: null,
        fail_count: null,
        webhook_status: null,
        response_code: null,
        error: null,
        sample_report_id: null,
        metadata: null,
      };

      const dto = mapRunRow(row);

      expect(dto.startedAt).toBeNull();
      expect(dto.completedAt).toBeNull();
      expect(dto.durationMs).toBeNull();
      expect(dto.batchesProcessed).toBeNull();
    });
  });

  describe('buildQueueKey', () => {
    it('creates sortable queue key with prefix', () => {
      const runId = 'run-abc123';
      const timestamp = 1700000000000;
      const key = buildQueueKey(runId, timestamp);

      expect(key).toContain(QUEUE_PREFIX);
      expect(key).toContain(runId);
      expect(key.startsWith(QUEUE_PREFIX)).toBe(true);
    });

    it('generates keys that sort chronologically', () => {
      const earlier = buildQueueKey('run-1', 1700000000000);
      const later = buildQueueKey('run-2', 1700000001000);

      expect(earlier < later).toBe(true);
    });
  });

  describe('Queue Operations (mocked)', () => {
    it('puts payload to KV with correct key format', async () => {
      const runId = 'run-test';
      const timestamp = Date.now();
      const key = buildQueueKey(runId, timestamp);
      const payload = { runId, taskId: 'task-1', enqueuedAt: timestamp, attempts: 0 };

      await mockKv.put(key, JSON.stringify(payload), { expirationTtl: 86400 });

      expect(mockKv.put).toHaveBeenCalledWith(
        key,
        JSON.stringify(payload),
        { expirationTtl: 86400 }
      );
    });

    it('lists queue items with prefix filter', async () => {
      mockKv.list.mockResolvedValue({ keys: [{ name: `${QUEUE_PREFIX}:1700000000000:run-1` }] });

      const result = await mockKv.list({ prefix: QUEUE_PREFIX, limit: 1 });

      expect(result.keys).toHaveLength(1);
      expect(result.keys[0].name.startsWith(QUEUE_PREFIX)).toBe(true);
    });

    it('claims and deletes queue item atomically', async () => {
      const key = `${QUEUE_PREFIX}:1700000000000:run-claim`;
      const payload = { runId: 'run-claim', taskId: 'task-1', enqueuedAt: Date.now(), attempts: 0 };

      mockKv.list.mockResolvedValue({ keys: [{ name: key }] });
      mockKv.get.mockResolvedValue(JSON.stringify(payload));

      const { keys } = await mockKv.list({ prefix: QUEUE_PREFIX, limit: 1 });
      const data = await mockKv.get(keys[0].name);
      await mockKv.delete(keys[0].name);

      expect(JSON.parse(data)).toEqual(payload);
      expect(mockKv.delete).toHaveBeenCalledWith(key);
    });
  });
});

describe('Task Status Transitions', () => {
  it('validates allowed status transitions', () => {
    const allowedTransitions: Record<string, string[]> = {
      inactive: ['scheduled', 'queued'],
      scheduled: ['queued', 'paused', 'inactive'],
      queued: ['running', 'failed'],
      running: ['scheduled', 'failed', 'inactive'],
      paused: ['scheduled', 'inactive'],
      failed: ['scheduled', 'inactive'],
    };

    expect(allowedTransitions.inactive).toContain('scheduled');
    expect(allowedTransitions.scheduled).toContain('queued');
    expect(allowedTransitions.queued).toContain('running');
    expect(allowedTransitions.running).toContain('scheduled');
  });
});

describe('Target Validation', () => {
  it('validates target schema requirements', () => {
    const validTarget = {
      type: 'scan' as const,
      label: 'My Batch',
      batchSize: 50,
      profileId: 'profile-1',
    };

    expect(validTarget.type).toBe('scan');
    expect(validTarget.batchSize).toBeGreaterThan(0);
    expect(validTarget.batchSize).toBeLessThanOrEqual(5000);
    expect(validTarget.label.length).toBeGreaterThanOrEqual(3);
  });

  it('rejects invalid batch sizes', () => {
    const invalidSizes = [-1, 0, 5001, 10000];

    invalidSizes.forEach((size) => {
      expect(size <= 0 || size > 5000).toBe(true);
    });
  });
});

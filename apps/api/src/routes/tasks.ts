import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import type { Env } from '../index';
import {
  createAutomationTask,
  dispatchDueAutomationTasks,
  getAutomationTaskWithRuns,
  listAutomationTasks,
  queueAutomationTask,
  updateAutomationTask,
} from '../services/tasks';
import { jsonError } from '../lib/responses';

export const tasksRoutes = new Hono<{ Bindings: Env }>();

const targetSchema = z.object({
  type: z.enum(['scan', 'report']).default('scan'),
  label: z.string().min(3),
  batchSize: z.number().int().positive().max(5000).default(50),
  profileId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const scheduleSchema = z
  .object({
    intervalMinutes: z.number().int().positive().optional(),
    dailyTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    cron: z.string().optional(),
    startAt: z.number().optional(),
    timezone: z.string().optional(),
  })
  .partial();

const createTaskSchema = z.object({
  name: z.string().min(3),
  projectId: z.string().optional(),
  cadence: z.enum(['manual', 'interval', 'hourly', 'daily', 'cron']),
  timezone: z.string().optional(),
  schedule: scheduleSchema.optional(),
  targets: z.array(targetSchema).min(1),
  webhook: z
    .object({
      url: z.string().url(),
      secret: z.string().min(8).optional(),
    })
    .optional(),
  activate: z.boolean().optional(),
});

const updateTaskSchema = z
  .object({
    name: z.string().min(3).optional(),
    cadence: z.enum(['manual', 'interval', 'hourly', 'daily', 'cron']).optional(),
    timezone: z.string().optional(),
    status: z.enum(['inactive', 'scheduled', 'queued', 'running', 'paused', 'failed']).optional(),
    schedule: scheduleSchema.optional(),
    targets: z.array(targetSchema).optional(),
    webhook: z
      .object({
        url: z.string().url().nullable().optional(),
        secret: z.string().min(8).nullable().optional(),
      })
      .optional(),
  })
  .partial();

// List tasks
tasksRoutes.get('/', async (c) => {
  const limit = Number(c.req.query('limit') || '25');
  const tasks = await listAutomationTasks(c.env.DB, Math.min(limit, 100));
  return c.json({ tasks });
});

// Create task
tasksRoutes.post('/', zValidator('json', createTaskSchema), async (c) => {
  const body = c.req.valid('json');
  const task = await createAutomationTask(c.env.DB, body);
  return c.json(task, 201);
});

// Get task detail + runs
tasksRoutes.get('/:id', async (c) => {
  const { task, runs } = await getAutomationTaskWithRuns(c.env.DB, c.req.param('id'));
  if (!task) {
    return jsonError(c, 'NOT_FOUND', 'Task not found', 404);
  }
  return c.json({ task, runs });
});

// Update task
tasksRoutes.patch('/:id', zValidator('json', updateTaskSchema), async (c) => {
  const task = await updateAutomationTask(c.env.DB, c.req.param('id'), c.req.valid('json'));
  if (!task) {
    return jsonError(c, 'NOT_FOUND', 'Task not found', 404);
  }
  return c.json(task);
});

// Trigger a task immediately
tasksRoutes.post('/:id/trigger', async (c) => {
  try {
    const payload = await queueAutomationTask(c.env.DB, c.env.TASK_QUEUE, c.req.param('id'), 'manual');
    return c.json(payload);
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Unable to enqueue task' }, 400);
  }
});

// Manual dispatcher endpoint (optional heartbeat)
tasksRoutes.post('/dispatch/run', async (c) => {
  const count = await dispatchDueAutomationTasks(c.env.DB, c.env.TASK_QUEUE);
  return c.json({ dispatched: count });
});

export default tasksRoutes;

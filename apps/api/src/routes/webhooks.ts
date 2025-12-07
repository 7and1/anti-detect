import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

import type { Env } from '../index';
import {
  createWebhookSubscription,
  deleteWebhookSubscription,
  getWebhookDeliveries,
  listWebhookSubscriptions,
  sendAdhocWebhookTest,
  triggerWebhookTest,
} from '../services/webhooks';
import { jsonError } from '../lib/responses';

export const webhooksRoutes = new Hono<{ Bindings: Env }>();

const createSchema = z.object({
  name: z.string().min(3),
  projectId: z.string().optional(),
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  secret: z.string().min(8).optional(),
  status: z.enum(['active', 'paused']).optional(),
});

const adHocTestSchema = z.object({
  url: z.string().url(),
  secret: z.string().min(8).optional(),
  projectId: z.string().optional(),
});

webhooksRoutes.get('/', async (c) => {
  const projectId = c.req.query('projectId');
  const webhooks = await listWebhookSubscriptions(c.env.DB, projectId || null);
  return c.json({ webhooks });
});

webhooksRoutes.post('/', zValidator('json', createSchema), async (c) => {
  const webhook = await createWebhookSubscription(c.env.DB, c.req.valid('json'));
  return c.json(webhook, 201);
});

webhooksRoutes.delete('/:id', async (c) => {
  await deleteWebhookSubscription(c.env.DB, c.req.param('id'));
  return c.json({ status: 'deleted' });
});

webhooksRoutes.get('/:id/deliveries', async (c) => {
  const deliveries = await getWebhookDeliveries(c.env.DB, c.req.param('id'));
  return c.json({ deliveries });
});

webhooksRoutes.post('/:id/test', async (c) => {
  const delivery = await triggerWebhookTest(c.env.DB, c.env, c.req.param('id'));
  if (!delivery) {
    return jsonError(c, 'NOT_FOUND', 'Webhook not found', 404);
  }
  return c.json({ delivery });
});

webhooksRoutes.post('/test', zValidator('json', adHocTestSchema), async (c) => {
  const result = await sendAdhocWebhookTest(c.env, c.req.valid('json'));
  return c.json(result);
});

export default webhooksRoutes;

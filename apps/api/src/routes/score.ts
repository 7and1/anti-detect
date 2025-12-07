import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { Env } from '../index';
import {
  listProfiles,
  createProfile,
  updateProfile,
  deleteProfile,
  getProfile,
} from '../services/scoring-profiles';
import type { ScoringWeights } from '@anti-detect/consistency';
import { jsonError } from '../lib/responses';

const weightsSchema = z.object({
  network: z.number().min(0).max(1),
  navigator: z.number().min(0).max(1),
  graphics: z.number().min(0).max(1),
  audio: z.number().min(0).max(1),
  fonts: z.number().min(0).max(1),
  locale: z.number().min(0).max(1),
  automation: z.number().min(0).max(1),
});

const profileInputSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(280).optional(),
  useCase: z.string().max(120).optional(),
  weights: weightsSchema,
  isDefault: z.boolean().optional(),
});

export const scoreRoutes = new Hono<{ Bindings: Env }>();

scoreRoutes.get('/profiles', async (c) => {
  const data = await listProfiles(c.env.DB);
  return c.json({ profiles: data });
});

scoreRoutes.get('/profiles/:id', async (c) => {
  const profile = await getProfile(c.env.DB, c.req.param('id'));
  if (!profile) {
    return jsonError(c, 'NOT_FOUND', 'Profile not found', 404);
  }
  return c.json(profile);
});

scoreRoutes.post('/profiles', zValidator('json', profileInputSchema), async (c) => {
  const payload = c.req.valid('json');
  const created = await createProfile(c.env.DB, payload);
  return c.json(created, 201);
});

scoreRoutes.put('/profiles/:id', zValidator('json', profileInputSchema.partial()), async (c) => {
  const payload = c.req.valid('json');
  const updated = await updateProfile(c.env.DB, c.req.param('id'), payload);
  if (!updated) {
    return jsonError(c, 'NOT_FOUND', 'Profile not found', 404);
  }
  return c.json(updated);
});

scoreRoutes.delete('/profiles/:id', async (c) => {
  const deleted = await deleteProfile(c.env.DB, c.req.param('id'));
  if (!deleted) {
    return jsonError(c, 'NOT_FOUND', 'Profile not found', 404);
  }
  return c.json({ success: true });
});

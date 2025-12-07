import type { D1Database } from '@cloudflare/workers-types';
import type { ScoringWeights } from '@anti-detect/consistency';

export interface ScoringProfile {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  useCase?: string | null;
  weights: ScoringWeights;
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}

function mapRow(row: any): ScoringProfile {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    useCase: row.use_case,
    weights: JSON.parse(row.weights || '{}'),
    isDefault: Boolean(row.is_default),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

export async function listProfiles(db: D1Database): Promise<ScoringProfile[]> {
  const { results } = await db
    .prepare('SELECT * FROM scoring_profiles ORDER BY is_default DESC, created_at DESC')
    .all();
  return (results || []).map(mapRow);
}

export async function getProfile(db: D1Database, idOrSlug: string): Promise<ScoringProfile | null> {
  const row = await db
    .prepare('SELECT * FROM scoring_profiles WHERE id = ? OR slug = ? LIMIT 1')
    .bind(idOrSlug, idOrSlug)
    .first();
  return row ? mapRow(row) : null;
}

export interface ProfileInput {
  name: string;
  slug?: string;
  description?: string;
  useCase?: string;
  weights: ScoringWeights;
  isDefault?: boolean;
}

export async function createProfile(db: D1Database, input: ProfileInput): Promise<ScoringProfile> {
  const id = crypto.randomUUID();
  const slug = input.slug || input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const now = Date.now();

  await db
    .prepare(
      `INSERT INTO scoring_profiles (id, slug, name, description, use_case, weights, is_default, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      slug,
      input.name,
      input.description || null,
      input.useCase || null,
      JSON.stringify(input.weights),
      input.isDefault ? 1 : 0,
      now,
      now
    )
    .run();

  return {
    id,
    slug,
    name: input.name,
    description: input.description,
    useCase: input.useCase,
    weights: input.weights,
    isDefault: Boolean(input.isDefault),
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateProfile(
  db: D1Database,
  id: string,
  input: Partial<ProfileInput>
): Promise<ScoringProfile | null> {
  const existing = await getProfile(db, id);
  if (!existing) return null;

  const nextWeights = input.weights || existing.weights;
  const slug = input.slug || existing.slug;
  const now = Date.now();

  await db
    .prepare(
      `UPDATE scoring_profiles
       SET slug = ?, name = ?, description = ?, use_case = ?, weights = ?, is_default = ?, updated_at = ?
       WHERE id = ?`
    )
    .bind(
      slug,
      input.name || existing.name,
      input.description ?? existing.description ?? null,
      input.useCase ?? existing.useCase ?? null,
      JSON.stringify(nextWeights),
      typeof input.isDefault === 'boolean' ? (input.isDefault ? 1 : 0) : existing.isDefault ? 1 : 0,
      now,
      existing.id
    )
    .run();

  return {
    ...existing,
    slug,
    name: input.name || existing.name,
    description: input.description ?? existing.description,
    useCase: input.useCase ?? existing.useCase,
    weights: nextWeights,
    isDefault: typeof input.isDefault === 'boolean' ? input.isDefault : existing.isDefault,
    updatedAt: now,
  };
}

export async function deleteProfile(db: D1Database, id: string): Promise<boolean> {
  const res = await db.prepare('DELETE FROM scoring_profiles WHERE id = ?').bind(id).run();
  return (res.meta?.changes || 0) > 0;
}

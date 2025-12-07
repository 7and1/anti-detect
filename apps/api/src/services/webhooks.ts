import type { D1Database } from '@cloudflare/workers-types';
import type {
  WebhookSubscriptionDTO,
  WebhookDeliveryDTO,
  AutomationTaskDTO,
  AutomationTaskRunDTO,
} from '@anti-detect/types';

import type { Env } from '../index';

const SUB_FIELDS = `id, project_id, name, url, status, events, created_at, updated_at, last_delivery_at, secret`;
const DELIVERY_FIELDS = `id, subscription_id, event, status, response_code, error, payload, delivered_at, duration_ms`;

interface WebhookRow {
  id: string;
  project_id: string | null;
  name: string;
  url: string;
  status: 'active' | 'paused';
  events: string;
  created_at: number;
  updated_at: number;
  last_delivery_at: number | null;
  secret: string;
}

interface DeliveryRow {
  id: string;
  subscription_id: string;
  event: string;
  status: string;
  response_code: number | null;
  error: string | null;
  payload: string;
  delivered_at: number;
  duration_ms: number | null;
}

export interface CreateWebhookInput {
  name: string;
  projectId?: string | null;
  url: string;
  events: string[];
  secret?: string;
  status?: 'active' | 'paused';
}

export async function listWebhookSubscriptions(
  db: D1Database,
  projectId?: string | null
): Promise<WebhookSubscriptionDTO[]> {
  const clause = projectId ? 'WHERE project_id = ? OR project_id IS NULL' : '';
  const query = `SELECT ${SUB_FIELDS} FROM webhook_subscriptions ${clause} ORDER BY created_at DESC`;
  const bindings = projectId ? [projectId] : [];

  const { results } = await db.prepare(query).bind(...bindings).all<WebhookRow>();
  return (results || []).map(mapSubscriptionRow);
}

export async function createWebhookSubscription(
  db: D1Database,
  input: CreateWebhookInput
): Promise<WebhookSubscriptionDTO> {
  const id = crypto.randomUUID();
  const now = Date.now();
  const eventsJSON = JSON.stringify(input.events);

  await db
    .prepare(
      `INSERT INTO webhook_subscriptions (
        id, project_id, name, url, secret, events, status, created_at, updated_at, last_delivery_at, verification_token
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)`
    )
    .bind(
      id,
      input.projectId || null,
      input.name,
      input.url,
      input.secret || crypto.randomUUID(),
      eventsJSON,
      input.status || 'active',
      now,
      now
    )
    .run();

  return (await getWebhookSubscription(db, id))!;
}

export async function deleteWebhookSubscription(db: D1Database, id: string): Promise<void> {
  await db.prepare('DELETE FROM webhook_subscriptions WHERE id = ?').bind(id).run();
}

export async function getWebhookSubscription(
  db: D1Database,
  id: string
): Promise<WebhookSubscriptionDTO | null> {
  const row = await db
    .prepare(`SELECT ${SUB_FIELDS} FROM webhook_subscriptions WHERE id = ?`)
    .bind(id)
    .first<WebhookRow | null>();
  return row ? mapSubscriptionRow(row) : null;
}

export async function getWebhookDeliveries(
  db: D1Database,
  subscriptionId: string,
  limit = 20
): Promise<WebhookDeliveryDTO[]> {
  const { results } = await db
    .prepare(`SELECT ${DELIVERY_FIELDS} FROM webhook_deliveries WHERE subscription_id = ? ORDER BY delivered_at DESC LIMIT ?`)
    .bind(subscriptionId, limit)
    .all<DeliveryRow>();
  return (results || []).map(mapDeliveryRow);
}

export async function emitAutomationEvent(
  db: D1Database,
  env: Env,
  params: {
    event: string;
    task: AutomationTaskDTO;
    run: AutomationTaskRunDTO;
    directWebhook?: { url: string | null; secret?: string | null } | null;
  }
) {
  const payload = {
    id: crypto.randomUUID(),
    type: params.event,
    projectId: params.task.projectId,
    timestamp: Date.now(),
    data: {
      task: {
        id: params.task.id,
        name: params.task.name,
        cadence: params.task.cadence,
        status: params.task.status,
      },
      run: params.run,
    },
  };

  const body = JSON.stringify(payload);
  const subscriptions = await listWebhookSubscriptions(db, params.task.projectId || null);
  const deliveries = subscriptions.filter((sub) => sub.events.includes(params.event));

  await Promise.all(
    deliveries.map((subscription) =>
      deliverToSubscription(db, {
        subscription,
        event: params.event,
        body,
      })
    )
  );

  if (params.directWebhook?.url) {
    await sendAdhocWebhook(env, {
      url: params.directWebhook.url,
      secret: params.directWebhook.secret || env.WEBHOOK_SIGNING_SECRET,
      body,
      event: params.event,
    });
  }
}

export async function triggerWebhookTest(
  db: D1Database,
  env: Env,
  subscriptionId: string
): Promise<WebhookDeliveryDTO | null> {
  const subscription = await getWebhookSubscription(db, subscriptionId);
  if (!subscription) {
    return null;
  }

  const body = JSON.stringify({
    id: crypto.randomUUID(),
    type: 'webhook.test',
    projectId: subscription.projectId,
    timestamp: Date.now(),
    data: {
      message: 'Webhook test payload',
    },
  });

  await deliverToSubscription(db, env, {
    subscription,
    event: 'webhook.test',
    body,
  });

  const deliveries = await getWebhookDeliveries(db, subscriptionId, 1);
  return deliveries[0] || null;
}

export async function sendAdhocWebhookTest(
  env: Env,
  input: { url: string; secret?: string; projectId?: string | null }
): Promise<{ ok: boolean; status: number; error?: string }> {
  const body = JSON.stringify({
    id: crypto.randomUUID(),
    type: 'webhook.test',
    projectId: input.projectId || null,
    timestamp: Date.now(),
    data: { message: 'Adhoc webhook test' },
  });

  try {
    const response = await sendAdhocWebhook(env, {
      url: input.url,
      secret: input.secret || env.WEBHOOK_SIGNING_SECRET,
      body,
      event: 'webhook.test',
    });
    return { ok: response.ok, status: response.status };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : 'Webhook request failed',
    };
  }
}

async function deliverToSubscription(
  db: D1Database,
  params: { subscription: WebhookSubscriptionDTO; event: string; body: string }
) {
  const start = Date.now();
  const secret = await getSubscriptionSecret(db, params.subscription.id);
  const signature = await signPayload(secret, params.body);

  let status: 'delivered' | 'failed' = 'delivered';
  let responseCode: number | null = null;
  let error: string | null = null;

  try {
    const response = await fetch(params.subscription.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Anti-Detect-Event': params.event,
        'X-Anti-Detect-Signature': signature,
      },
      body: params.body,
    });
    responseCode = response.status;
    if (!response.ok) {
      status = 'failed';
      error = await response.text();
    }
  } catch (err) {
    status = 'failed';
    error = err instanceof Error ? err.message : 'Webhook request failed';
  }

  const duration = Date.now() - start;

  await db
    .prepare(
      `INSERT INTO webhook_deliveries (id, subscription_id, event, status, response_code, error, payload, delivered_at, duration_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      crypto.randomUUID(),
      params.subscription.id,
      params.event,
      status,
      responseCode,
      error,
      params.body,
      Date.now(),
      duration
    )
    .run();

  await db
    .prepare('UPDATE webhook_subscriptions SET last_delivery_at = ?, updated_at = ? WHERE id = ?')
    .bind(Date.now(), Date.now(), params.subscription.id)
    .run();
}

async function sendAdhocWebhook(
  env: Env,
  input: { url: string; secret: string; body: string; event: string }
) {
  const signature = await signPayload(input.secret, input.body);
  return fetch(input.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Anti-Detect-Event': input.event,
      'X-Anti-Detect-Signature': signature,
    },
    body: input.body,
  });
}

async function getSubscriptionSecret(db: D1Database, id: string): Promise<string> {
  const row = await db
    .prepare('SELECT secret FROM webhook_subscriptions WHERE id = ?')
    .bind(id)
    .first<{ secret: string } | null>();
  if (!row) {
    return crypto.randomUUID();
  }
  return row.secret;
}

function mapSubscriptionRow(row: WebhookRow): WebhookSubscriptionDTO {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    url: row.url,
    status: row.status,
    events: safeParseJSON<string[]>(row.events, []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastDeliveryAt: row.last_delivery_at,
  };
}

function mapDeliveryRow(row: DeliveryRow): WebhookDeliveryDTO {
  return {
    id: row.id,
    subscriptionId: row.subscription_id,
    event: row.event,
    status: row.status as 'delivered' | 'failed',
    responseCode: row.response_code,
    error: row.error,
    deliveredAt: row.delivered_at,
    durationMs: row.duration_ms,
    payload: safeParseJSON<Record<string, unknown>>(row.payload, {}),
  };
}

function safeParseJSON<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function signPayload(secret: string, body: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

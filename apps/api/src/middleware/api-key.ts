import type { MiddlewareHandler } from 'hono';
import type { Env } from '../index';
import { jsonError } from '../lib/responses';

let cachedKeys: string[] | null = null;

export const apiKeyAuth = (options?: { exemptPaths?: RegExp[] }): MiddlewareHandler<{ Bindings: Env }> => {
  const exempt = options?.exemptPaths ?? [/^\/health$/, /^\/stats$/];

  return async (c, next) => {
    const path = c.req.path;
    if (exempt.some((regex) => regex.test(path))) {
      return next();
    }

    if (!cachedKeys) {
      const raw = c.env.API_KEYS || '';
      cachedKeys = raw
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);
      if (cachedKeys.length === 0) {
        console.warn('API key auth is disabled because API_KEYS is empty. Set API_KEYS to enable protection.');
      }
    }

    if (cachedKeys.length === 0) {
      return next();
    }

    const header = c.req.header('authorization') || c.req.header('Authorization') || '';
    const apiKeyHeader = c.req.header('x-api-key');
    const token = apiKeyHeader || (header.toLowerCase().startsWith('bearer ') ? header.slice(7) : null);

    if (!token || !cachedKeys.includes(token)) {
      return jsonError(c, 'UNAUTHORIZED', 'Missing or invalid API key', 401);
    }

    return next();
  };
};

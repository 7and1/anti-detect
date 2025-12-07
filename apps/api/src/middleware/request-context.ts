import type { MiddlewareHandler } from 'hono';

/**
 * Attaches a request ID and lightweight timing info to every response.
 * Keeps correlation IDs consistent even when upstream provides one.
 */
export const requestContext = (): MiddlewareHandler => {
  return async (c, next) => {
    const started = Date.now();
    const requestId = c.req.header('X-Request-ID') || crypto.randomUUID();

    c.header('X-Request-ID', requestId);

    try {
      await next();
    } finally {
      const duration = Date.now() - started;
      c.header('X-Response-Time', `${duration}ms`);
    }
  };
};

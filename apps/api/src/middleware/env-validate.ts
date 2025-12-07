import type { MiddlewareHandler } from 'hono';
import type { Env } from '../index';

let validated = false;
let validationError: string | null = null;

export const validateEnv = (): MiddlewareHandler<{ Bindings: Env }> => {
  return async (c, next) => {
    if (!validated) {
      const missing = [];
      const requiredVars = ['ENVIRONMENT', 'CORS_ORIGIN'];
      for (const key of requiredVars) {
        if (!c.env[key as keyof Env]) {
          missing.push(key);
        }
      }

      if (!c.env.DB) missing.push('DB');
      if (!c.env.RATE_LIMITS) missing.push('RATE_LIMITS');
      if (!c.env.TASK_QUEUE) missing.push('TASK_QUEUE');

      if (missing.length) {
        validationError = `Missing required env bindings: ${missing.join(', ')}`;
        console.error(validationError);
      }

      validated = true;
    }

    if (validationError) {
      return c.json(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: validationError,
            statusCode: 503,
          },
        },
        503
      );
    }

    return next();
  };
};

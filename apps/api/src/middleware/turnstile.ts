import { Context, Next } from 'hono';
import type { Env } from '../index';

interface TurnstileResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
}

/**
 * Turnstile verification middleware
 * Validates Cloudflare Turnstile tokens for protected endpoints
 */
export const turnstileMiddleware = () => {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    // Skip in development if no secret configured
    if (!c.env.TURNSTILE_SECRET && c.env.ENVIRONMENT === 'development') {
      console.warn('Turnstile: Skipping verification in development (no secret configured)');
      await next();
      return;
    }

    // Get token from header
    const token = c.req.header('X-Turnstile-Token');

    if (!token) {
      return c.json(
        {
          error: 'Turnstile verification required',
          message: 'Missing X-Turnstile-Token header',
          code: 'TURNSTILE_TOKEN_MISSING',
        },
        403
      );
    }

    // Verify with Cloudflare
    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || '';

    try {
      const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret: c.env.TURNSTILE_SECRET,
          response: token,
          remoteip: ip,
        }),
      });

      const result = (await response.json()) as TurnstileResponse;

      if (!result.success) {
        console.warn('Turnstile verification failed:', result['error-codes']);
        return c.json(
          {
            error: 'Turnstile verification failed',
            message: 'Invalid or expired token',
            code: 'TURNSTILE_VERIFICATION_FAILED',
            errors: result['error-codes'],
          },
          403
        );
      }

      // Store verification info for downstream handlers
      c.set('turnstile', {
        verified: true,
        hostname: result.hostname,
        action: result.action,
        timestamp: result.challenge_ts,
      });

      await next();
    } catch (error) {
      console.error('Turnstile API error:', error);

      // Allow through on API errors to prevent blocking users
      // Rate limiting will still protect against abuse
      if (c.env.ENVIRONMENT === 'production') {
        return c.json(
          {
            error: 'Verification service unavailable',
            message: 'Please try again later',
            code: 'TURNSTILE_SERVICE_ERROR',
          },
          503
        );
      }

      // In non-production, allow through with warning
      console.warn('Turnstile: Allowing through due to API error');
      await next();
    }
  };
};

/**
 * Optional Turnstile middleware - verifies if token present, passes through if not
 * Use this for endpoints where Turnstile is preferred but not required
 */
export const optionalTurnstileMiddleware = () => {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const token = c.req.header('X-Turnstile-Token');

    // No token provided - pass through
    if (!token) {
      c.set('turnstile', { verified: false });
      await next();
      return;
    }

    // Token provided - verify it
    const middleware = turnstileMiddleware();
    return middleware(c, next);
  };
};

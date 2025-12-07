import type { Context } from 'hono';

type ErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMIT_EXCEEDED'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR'
  | 'TOO_MANY_REQUESTS';

interface ErrorPayload {
  error: {
    code: ErrorCode;
    message: string;
    statusCode: number;
    requestId?: string;
    details?: Record<string, unknown>;
  };
}

export function getRequestId(c: Context): string {
  return c.res.headers.get('X-Request-ID') || c.req.header('X-Request-ID') || crypto.randomUUID();
}

export function jsonError(
  c: Context,
  code: ErrorCode,
  message: string,
  statusCode: number,
  details?: Record<string, unknown>
) {
  const requestId = getRequestId(c);
  c.header('X-Request-ID', requestId);

  const payload: ErrorPayload = {
    error: {
      code,
      message,
      statusCode,
      requestId,
      ...(details ? { details } : {}),
    },
  };

  return c.json(payload, statusCode);
}

export function jsonOk<T extends Record<string, unknown>>(c: Context, body: T, statusCode = 200) {
  return c.json({ ...body, requestId: getRequestId(c) }, statusCode);
}

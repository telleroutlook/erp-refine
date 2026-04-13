// src/middleware/request-id.ts
// Inject X-Request-Id header and set it in context

import type { MiddlewareHandler } from 'hono';
import type { Env } from '../types/env';

export function requestIdMiddleware(): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    const supplied = c.req.header('X-Request-Id');
    const requestId = (supplied && /^[\w\-]{1,64}$/.test(supplied))
      ? supplied
      : crypto.randomUUID();
    c.set('requestId', requestId);
    c.header('X-Request-Id', requestId);
    await next();
  };
}

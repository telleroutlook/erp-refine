// src/middleware/request-id.ts
// Inject X-Request-Id header and set it in context

import type { MiddlewareHandler } from 'hono';
import type { Env } from '../types/env';

export function requestIdMiddleware(): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    const requestId = c.req.header('X-Request-Id') ?? crypto.randomUUID();
    c.set('requestId', requestId);
    c.header('X-Request-Id', requestId);
    await next();
  };
}

// src/middleware/cors.ts
// CORS middleware

import { cors } from 'hono/cors';
import type { MiddlewareHandler } from 'hono';
import type { Env } from '../types/env';

export function corsMiddleware(): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    const origins = c.env.ALLOWED_ORIGINS?.split(',').map((s) => s.trim()) ?? ['*'];
    return cors({
      origin: origins,
      credentials: true,
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      exposeHeaders: ['X-Request-Id', 'X-Total-Count'],
    })(c, next);
  };
}

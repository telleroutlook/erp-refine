// src/middleware/cors.ts
// CORS middleware

import { cors } from 'hono/cors';
import type { MiddlewareHandler } from 'hono';
import type { Env } from '../types/env';

let cachedHandler: ReturnType<typeof cors> | null = null;
let cachedOrigins: string | null = null;

export function corsMiddleware(): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    if (!c.env.ALLOWED_ORIGINS) {
      return c.json({ error: 'Server misconfiguration: ALLOWED_ORIGINS not set' }, 500);
    }
    if (cachedOrigins !== c.env.ALLOWED_ORIGINS) {
      cachedOrigins = c.env.ALLOWED_ORIGINS;
      const origins = cachedOrigins.split(',').map((s) => s.trim());
      cachedHandler = cors({
        origin: origins,
        credentials: true,
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
        exposeHeaders: ['X-Request-Id', 'X-Total-Count'],
      });
    }
    return cachedHandler!(c, next);
  };
}

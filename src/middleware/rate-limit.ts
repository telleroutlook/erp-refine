// src/middleware/rate-limit.ts
// Rate limiting via Durable Objects

import type { MiddlewareHandler } from 'hono';
import type { Env } from '../types/env';

export function rateLimitMiddleware(): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    const ip = c.req.header('CF-Connecting-IP') ?? 'unknown';
    const key = `ratelimit:${ip}`;

    try {
      const id = c.env.RATE_LIMITER_DO.idFromName(key);
      const stub = c.env.RATE_LIMITER_DO.get(id);
      const limit = parseInt(c.env.RATE_LIMIT_REQUESTS ?? '100', 10);
      const period = parseInt(c.env.RATE_LIMIT_PERIOD ?? '60', 10);

      const res = await stub.fetch(
        new Request('https://internal/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ limit, period }),
        })
      );

      if (res.status === 429) {
        return c.json({ error: 'Rate limit exceeded' }, 429);
      }
    } catch (e) {
      console.warn('[rate-limit] DO unavailable, failing open:', e);
    }

    await next();
  };
}

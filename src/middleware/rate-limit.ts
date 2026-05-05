// src/middleware/rate-limit.ts
// Rate limiting via Durable Objects

import type { MiddlewareHandler } from 'hono';
import type { Env } from '../types/env';

/**
 * IP-based rate limiter — runs before auth to protect against brute-force.
 */
export function rateLimitMiddleware(): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    const ip = c.req.header('CF-Connecting-IP') ?? 'unknown';
    const key = `ratelimit:ip:${ip}`;

    try {
      const id = c.env.RATE_LIMITER_DO.idFromName(key);
      const stub = c.env.RATE_LIMITER_DO.get(id);
      const limit = parseInt(c.env.RATE_LIMIT_REQUESTS ?? '100', 10);
      const period = parseInt(c.env.RATE_LIMIT_PERIOD ?? '60', 10);

      const res = await stub.fetch(
        new Request(`https://internal/check?limit=${limit}&period=${period}`, {
          method: 'POST',
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

/**
 * Stricter per-IP rate limiter for auth endpoints (login/refresh).
 * Uses a separate bucket namespace to enforce tighter limits (default 10 req/60s).
 */
export function authRateLimitMiddleware(opts?: { limit?: number; period?: number }): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    const ip = c.req.header('CF-Connecting-IP') ?? 'unknown';
    const key = `ratelimit:auth:${ip}`;

    try {
      const id = c.env.RATE_LIMITER_DO.idFromName(key);
      const stub = c.env.RATE_LIMITER_DO.get(id);
      const limit = opts?.limit ?? 10;
      const period = opts?.period ?? 60;

      const res = await stub.fetch(
        new Request(`https://internal/check?limit=${limit}&period=${period}`, {
          method: 'POST',
        })
      );

      if (res.status === 429) {
        return c.json({ error: 'Too many login attempts, please try again later' }, 429);
      }
    } catch (e) {
      console.warn('[rate-limit] auth DO unavailable, failing open:', e);
    }

    await next();
  };
}

/**
 * Per-user rate limiter — runs after authMiddleware so user context is available.
 * Applies tighter per-user limits to prevent individual abuse.
 */
export function userRateLimitMiddleware(opts?: { limit?: number; period?: number }): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    const user = c.get('user' as never) as { userId?: string } | undefined;
    if (!user?.userId) {
      await next();
      return;
    }

    const key = `ratelimit:user:${user.userId}`;
    try {
      const id = c.env.RATE_LIMITER_DO.idFromName(key);
      const stub = c.env.RATE_LIMITER_DO.get(id);
      const limit = opts?.limit ?? parseInt(c.env.RATE_LIMIT_REQUESTS ?? '100', 10);
      const period = opts?.period ?? parseInt(c.env.RATE_LIMIT_PERIOD ?? '60', 10);

      const res = await stub.fetch(
        new Request(`https://internal/check?limit=${limit}&period=${period}`, {
          method: 'POST',
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

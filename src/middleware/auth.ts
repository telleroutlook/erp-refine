// src/middleware/auth.ts
// JWT authentication middleware — validates Supabase JWT, injects user context

import type { Context, MiddlewareHandler, Next } from 'hono';
import { jwtVerify, importSPKI } from 'jose';
import type { Env } from '../types/env';

export interface UserContext {
  userId: string;
  email: string;
  organizationId: string;
  role: string;
}

declare module 'hono' {
  interface ContextVariableMap {
    user: UserContext;
    requestId: string;
  }
}

export function authMiddleware(): MiddlewareHandler<{ Bindings: Env }> {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or invalid Authorization header' }, 401);
    }

    const token = authHeader.slice(7);

    try {
      // Verify JWT using the Supabase JWT secret
      const secret = new TextEncoder().encode(c.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });

      const appMeta = (payload.app_metadata as Record<string, string>) ?? {};
      const user: UserContext = {
        userId: payload.sub ?? '',
        email: (payload.email as string) ?? '',
        organizationId: appMeta['organization_id'] ?? '',
        role: appMeta['role'] ?? 'viewer',
      };

      if (!user.userId || !user.organizationId) {
        return c.json({ error: 'Invalid token claims' }, 401);
      }

      c.set('user', user);
      await next();
    } catch {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }
  };
}

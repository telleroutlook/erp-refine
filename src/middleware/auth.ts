// src/middleware/auth.ts
// JWT authentication middleware — validates Supabase JWT, injects user context
// Supports both HS256 (legacy JWT secret) and ES256 (JWKS) verification

import type { Context, MiddlewareHandler, Next } from 'hono';
import { jwtVerify, importSPKI, importJWK, createRemoteJWKSet, type JWTVerifyResult } from 'jose';
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

// Cache the JWKS fetch to avoid repeated network calls
let cachedJWKS: ReturnType<typeof createRemoteJWKSet> | null = null;

export function authMiddleware(): MiddlewareHandler<{ Bindings: Env }> {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or invalid Authorization header' }, 401);
    }

    const token = authHeader.slice(7);

    try {
      let result: JWTVerifyResult;

      // Detect algorithm from token header
      const headerB64 = token.split('.')[0];
      const header = JSON.parse(atob(headerB64));

      if (header.alg === 'HS256' && c.env.JWT_SECRET) {
        // Legacy: HS256 with shared secret
        const secret = new TextEncoder().encode(c.env.JWT_SECRET);
        result = await jwtVerify(token, secret, { algorithms: ['HS256'] });
      } else {
        // ES256 / asymmetric: verify via Supabase JWKS endpoint
        const supabaseUrl = c.env.SUPABASE_URL;
        if (!supabaseUrl) {
          return c.json({ error: 'Server misconfiguration: SUPABASE_URL not set' }, 500);
        }

        const jwksUrl = new URL('/auth/v1/.well-known/jwks.json', supabaseUrl);
        if (!cachedJWKS) {
          cachedJWKS = createRemoteJWKSet(jwksUrl);
        }

        result = await jwtVerify(token, cachedJWKS, {
          algorithms: ['ES256'],
        });
      }

      const { payload } = result;
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

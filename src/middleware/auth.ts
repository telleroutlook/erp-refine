// src/middleware/auth.ts
// JWT authentication middleware — validates Supabase JWT, injects user context
// Supports both HS256 (legacy JWT secret) and ES256 (JWKS) verification

import type { Context, MiddlewareHandler, Next } from 'hono';
import { jwtVerify, importJWK, type JWTVerifyResult, type KeyLike } from 'jose';
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

// Cache imported keys (supports multiple kids during key rotation)
const cachedKeys = new Map<string, { key: KeyLike; cachedAt: number }>();
const JWKS_TTL_MS = 3_600_000; // 1 hour

async function getVerifyKey(supabaseUrl: string, kid: string): Promise<KeyLike> {
  if (typeof kid !== 'string' || kid.length > 256) {
    throw new Error('Invalid kid');
  }

  const now = Date.now();
  const entry = cachedKeys.get(kid);
  if (entry && (now - entry.cachedAt) < JWKS_TTL_MS) {
    return entry.key;
  }

  const jwksUrl = new URL('/auth/v1/.well-known/jwks.json', supabaseUrl);
  const resp = await fetch(jwksUrl.toString());
  if (!resp.ok) throw new Error(`JWKS fetch failed: ${resp.status}`);
  const jwks = await resp.json() as { keys: Array<Record<string, unknown>> };

  for (const jwk of jwks.keys) {
    if (typeof jwk.kid === 'string') {
      const importedKey = (await importJWK(jwk as any, 'ES256')) as KeyLike;
      cachedKeys.set(jwk.kid, { key: importedKey, cachedAt: now });
    }
  }

  const resolved = cachedKeys.get(kid);
  if (!resolved) throw new Error(`JWK with kid '${kid}' not found`);
  return resolved.key;
}

export function authMiddleware(): MiddlewareHandler<{ Bindings: Env }> {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ type: 'UNAUTHORIZED', status: 401, title: 'Unauthorized', detail: 'Missing or invalid Authorization header', request_id: c.get('requestId') ?? 'unknown', timestamp: new Date().toISOString() }, 401);
    }

    const token = authHeader.slice(7);

    let result: JWTVerifyResult;
    try {
      const headerB64 = token.split('.')[0] ?? '';
      const header = JSON.parse(atob(headerB64));
      const supabaseUrl = c.env.SUPABASE_URL;

      if (header.kid && supabaseUrl) {
        const key = await getVerifyKey(supabaseUrl, header.kid);
        result = await jwtVerify(token, key, {
          algorithms: ['ES256'],
          issuer: new URL('/auth/v1', supabaseUrl).toString(),
        });
      } else if (c.env.JWT_SECRET) {
        const secret = new TextEncoder().encode(c.env.JWT_SECRET);
        result = await jwtVerify(token, secret, {
          algorithms: ['HS256'],
          issuer: new URL('/auth/v1', c.env.SUPABASE_URL).toString(),
        });
      } else {
        return c.json({ type: 'UNAUTHORIZED', status: 401, title: 'Unauthorized', detail: 'Invalid or expired token', request_id: c.get('requestId') ?? 'unknown', timestamp: new Date().toISOString() }, 401);
      }
    } catch {
      return c.json({ type: 'UNAUTHORIZED', status: 401, title: 'Unauthorized', detail: 'Invalid or expired token', request_id: c.get('requestId') ?? 'unknown', timestamp: new Date().toISOString() }, 401);
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
      return c.json({ type: 'UNAUTHORIZED', status: 401, title: 'Unauthorized', detail: 'Invalid token claims: missing userId or organizationId', request_id: c.get('requestId') ?? 'unknown', timestamp: new Date().toISOString() }, 401);
    }

    c.set('user', user);
    await next();
  };
}

export function requireRole(...roles: string[]): MiddlewareHandler<{ Bindings: Env }> {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const user = c.get('user') as UserContext;
    if (!roles.includes(user.role)) {
      return c.json({ type: 'FORBIDDEN', status: 403, title: 'Forbidden', detail: 'Insufficient permissions', request_id: c.get('requestId') ?? 'unknown', timestamp: new Date().toISOString() }, 403);
    }
    await next();
  };
}

export function writeMethodGuard(): MiddlewareHandler<{ Bindings: Env }> {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const method = c.req.method;
    if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
      const user = c.get('user') as UserContext;
      if (user.role === 'viewer') {
        return c.json({ type: 'FORBIDDEN', status: 403, title: 'Forbidden', detail: 'Viewers cannot perform write operations', request_id: c.get('requestId') ?? 'unknown', timestamp: new Date().toISOString() }, 403);
      }
    }
    await next();
  };
}

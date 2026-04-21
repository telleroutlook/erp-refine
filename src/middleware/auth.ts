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

// Cache imported key (not the raw JWKS — the actual CryptoKey)
let cachedKey: KeyLike | null = null;
let cachedKeyKid: string | null = null;
let cachedKeyAt = 0;
const JWKS_TTL_MS = 3_600_000; // 1 hour

async function getVerifyKey(supabaseUrl: string, kid: string): Promise<KeyLike> {
  const now = Date.now();
  if (cachedKey && cachedKeyKid === kid && (now - cachedKeyAt) < JWKS_TTL_MS) {
    return cachedKey;
  }

  const jwksUrl = new URL('/auth/v1/.well-known/jwks.json', supabaseUrl);
  const resp = await fetch(jwksUrl.toString());
  if (!resp.ok) throw new Error(`JWKS fetch failed: ${resp.status}`);
  const jwks = await resp.json() as { keys: Array<Record<string, unknown>> };

  const jwk = jwks.keys.find((k: any) => k.kid === kid);
  if (!jwk) throw new Error(`JWK with kid '${kid}' not found`);

  cachedKey = (await importJWK(jwk as any, 'ES256')) as KeyLike;
  cachedKeyKid = kid;
  cachedKeyAt = now;
  return cachedKey;
}

export function authMiddleware(): MiddlewareHandler<{ Bindings: Env }> {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or invalid Authorization header' }, 401);
    }

    const token = authHeader.slice(7);

    let result: JWTVerifyResult;
    try {
      // Detect algorithm from token header
      const headerB64 = token.split('.')[0] ?? '';
      const header = JSON.parse(atob(headerB64));

      if (header.alg === 'HS256' && c.env.JWT_SECRET) {
        const secret = new TextEncoder().encode(c.env.JWT_SECRET);
        result = await jwtVerify(token, secret, {
          algorithms: ['HS256'],
          issuer: new URL('/auth/v1', c.env.SUPABASE_URL).toString(),
        });
      } else if (header.alg === 'ES256') {
        const supabaseUrl = c.env.SUPABASE_URL;
        if (!supabaseUrl) {
          return c.json({ error: 'Server misconfiguration: SUPABASE_URL not set' }, 500);
        }
        const key = await getVerifyKey(supabaseUrl, header.kid ?? '');
        result = await jwtVerify(token, key, {
          algorithms: ['ES256'],
          issuer: new URL('/auth/v1', c.env.SUPABASE_URL).toString(),
        });
      } else {
        return c.json({ error: `Unsupported JWT algorithm: ${header.alg}` }, 401);
      }
    } catch {
      return c.json({ error: 'Invalid or expired token' }, 401);
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
  };
}

export function requireRole(...roles: string[]): MiddlewareHandler<{ Bindings: Env }> {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const user = c.get('user') as UserContext;
    if (!roles.includes(user.role)) {
      return c.json({ error: 'Insufficient permissions' }, 403);
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
        return c.json({ error: 'Viewers cannot perform write operations' }, 403);
      }
    }
    await next();
  };
}

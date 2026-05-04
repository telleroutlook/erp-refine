// src/routes/auth.ts
// Authentication routes — Supabase Auth passthrough + session management

import { Hono } from 'hono';
import type { Env } from '../types/env';
import { createSupabaseClient, createAuthenticatedClient, createServiceClient } from '../utils/supabase';

const auth = new Hono<{ Bindings: Env }>();

auth.post('/login', async (c) => {
  const body = await c.req.json<{ email: string; password: string }>();
  if (!body.email || !body.password) {
    return c.json({ error: 'Email and password required' }, 400);
  }

  const ip = c.req.header('CF-Connecting-IP') ?? c.req.header('X-Forwarded-For') ?? 'unknown';
  const userAgent = c.req.header('User-Agent') ?? 'unknown';

  const db = createSupabaseClient(c.env);
  const { data, error } = await db.auth.signInWithPassword({
    email: body.email,
    password: body.password,
  });

  if (error) {
    const svc = createServiceClient(c.env);
    c.executionCtx.waitUntil(
      Promise.resolve(svc.from('failed_login_attempts').insert({
        username: body.email,
        reason: error.message,
        ip_address: ip,
      })).then(() => {})
    );
    return c.json({ error: error.message }, 401);
  }

  const userId = data.user?.id;
  const orgId = (data.user?.app_metadata as Record<string, string>)?.organization_id;
  if (userId && orgId) {
    const svc = createServiceClient(c.env);
    c.executionCtx.waitUntil(
      Promise.resolve(svc.from('auth_events').insert({
        user_id: userId,
        organization_id: orgId,
        event_type: 'login',
        ip_address: ip,
        user_agent: userAgent,
        metadata: { method: 'password' },
      })).then(() => {})
    );
  }

  return c.json({
    data: {
      user: {
        id: userId,
        email: data.user?.email,
        role: (data.user?.app_metadata as Record<string, string>)?.role ?? 'viewer',
        organizationId: orgId,
      },
      session: {
        accessToken: data.session?.access_token,
        refreshToken: data.session?.refresh_token,
        expiresAt: data.session?.expires_at,
      },
    },
  });
});

auth.post('/logout', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return c.json({ error: 'No token' }, 401);

  const jwt = authHeader.slice(7);
  const db = createAuthenticatedClient(c.env, jwt);

  const { data: { user } } = await db.auth.getUser();
  const { error } = await db.auth.signOut();
  if (error) return c.json({ error: error.message }, 500);

  if (user) {
    const svc = createServiceClient(c.env);
    c.executionCtx.waitUntil(
      Promise.resolve(svc.from('auth_events').insert({
        user_id: user.id,
        organization_id: user.app_metadata?.organization_id,
        event_type: 'logout',
        ip_address: c.req.header('CF-Connecting-IP') ?? 'unknown',
        user_agent: c.req.header('User-Agent') ?? 'unknown',
      })).then(() => {})
    );
  }

  return c.json({ data: { message: 'Logged out' } });
});

auth.post('/refresh', async (c) => {
  const body = await c.req.json<{ refresh_token: string }>();
  if (!body.refresh_token) return c.json({ error: 'Refresh token required' }, 400);

  const db = createSupabaseClient(c.env);
  const { data, error } = await db.auth.refreshSession({ refresh_token: body.refresh_token });
  if (error) return c.json({ error: error.message }, 401);

  const user = data.user;
  if (user) {
    const svc = createServiceClient(c.env);
    c.executionCtx.waitUntil(
      Promise.resolve(svc.from('auth_events').insert({
        user_id: user.id,
        organization_id: user.app_metadata?.organization_id,
        event_type: 'token_refresh',
        ip_address: c.req.header('CF-Connecting-IP') ?? 'unknown',
        user_agent: c.req.header('User-Agent') ?? 'unknown',
      })).then(() => {})
    );
  }

  return c.json({
    data: {
      session: {
        accessToken: data.session?.access_token,
        refreshToken: data.session?.refresh_token,
        expiresAt: data.session?.expires_at,
      },
    },
  });
});

auth.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401);

  const db = createSupabaseClient(c.env);
  const { data: { user }, error } = await db.auth.getUser(authHeader.slice(7));
  if (error || !user) return c.json({ error: 'Invalid token' }, 401);

  return c.json({ data: {
    id: user.id,
    email: user.email,
    role: user.app_metadata?.role,
    organizationId: user.app_metadata?.organization_id,
  } });
});

export default auth;

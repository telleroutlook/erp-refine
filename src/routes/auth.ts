// src/routes/auth.ts
// Authentication routes — Supabase Auth passthrough + session management

import { Hono } from 'hono';
import type { Env } from '../types/env';
import { createSupabaseClient } from '../utils/supabase';

const auth = new Hono<{ Bindings: Env }>();

auth.post('/login', async (c) => {
  const body = await c.req.json<{ email: string; password: string }>();
  if (!body.email || !body.password) {
    return c.json({ error: 'Email and password required' }, 400);
  }

  const db = createSupabaseClient(c.env);
  const { data, error } = await db.auth.signInWithPassword({
    email: body.email,
    password: body.password,
  });

  if (error) return c.json({ error: error.message }, 401);

  return c.json({
    data: {
      user: data.user,
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
  if (!authHeader) return c.json({ error: 'No token' }, 401);

  const db = createSupabaseClient(c.env);
  const { error } = await db.auth.signOut();
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data: { message: 'Logged out' } });
});

auth.post('/refresh', async (c) => {
  const body = await c.req.json<{ refreshToken: string }>();
  if (!body.refreshToken) return c.json({ error: 'Refresh token required' }, 400);

  const db = createSupabaseClient(c.env);
  const { data, error } = await db.auth.refreshSession({ refresh_token: body.refreshToken });
  if (error) return c.json({ error: error.message }, 401);

  return c.json({
    data: {
      accessToken: data.session?.access_token,
      expiresAt: data.session?.expires_at,
    },
  });
});

auth.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401);

  const db = createSupabaseClient(c.env);
  const { data: { user }, error } = await db.auth.getUser(authHeader.slice(7));
  if (error || !user) return c.json({ error: 'Invalid token' }, 401);

  return c.json({ data: user });
});

export default auth;

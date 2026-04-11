// src/index.ts
// Worker entry point — Hono app with middleware and routes

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types/env';

const app = new Hono<{ Bindings: Env }>();

// --- Middleware ---

// CORS
app.use('*', async (c, next) => {
  const origins = c.env.ALLOWED_ORIGINS?.split(',').map((s) => s.trim()) || ['*'];
  return cors({ origin: origins, credentials: true })(c, next);
});

// Request ID
app.use('*', async (c, next) => {
  const requestId = crypto.randomUUID();
  c.header('X-Request-Id', requestId);
  c.set('requestId' as never, requestId);
  await next();
});

// --- Health check ---
app.get('/health', (c) => c.json({ status: 'ok', version: '0.1.0' }));

// --- API routes (to be implemented) ---
app.get('/api/ping', (c) => c.json({ message: 'pong', env: c.env.ENVIRONMENT }));

// --- Catch-all: serve SPA ---
app.get('*', async (c) => {
  return c.env.ASSETS.fetch(c.req.raw);
});

// --- Error handler ---
app.onError((err, c) => {
  console.error(`[${c.get('requestId' as never)}] Error:`, err.message);
  return c.json({ error: err.message }, 500);
});

export default app;

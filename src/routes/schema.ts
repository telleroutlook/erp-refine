// src/routes/schema.ts
// Schema Registry management routes

import { Hono } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware } from '../middleware/auth';
import { SchemaRegistry } from '../bff/schema-registry';
import { schemaArchitectAgent } from '../agents/schema-architect-agent';
import { createAuthenticatedClient } from '../utils/supabase';
import { ApiError } from '../utils/api-error';
import { ErrorCode } from '../types/errors';

const schema = new Hono<{ Bindings: Env }>();
schema.use('*', authMiddleware());

/** GET /api/schema — list schemas */
schema.get('/', async (c) => {
  const user = c.get('user');
  const status = c.req.query('status') as 'draft' | 'active' | 'archived' | undefined;
  const db = createAuthenticatedClient(c.env, c.req.header('Authorization')!.slice(7));
  const registry = new SchemaRegistry(db, user.organizationId);
  const data = await registry.list(status);
  return c.json({ data, total: data.length });
});

/** GET /api/schema/:id — get one schema */
schema.get('/:id', async (c) => {
  const user = c.get('user');
  const db = createAuthenticatedClient(c.env, c.req.header('Authorization')!.slice(7));
  const registry = new SchemaRegistry(db, user.organizationId);
  const data = await registry.get(c.req.param('id'));
  if (!data) {
    throw ApiError.notFound('Schema', c.req.param('id'), c.get('requestId') as string);
  }
  return c.json({ data });
});

/** POST /api/schema/generate — AI generates a schema draft */
schema.post('/generate', async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin') {
    throw new ApiError({ code: ErrorCode.FORBIDDEN, detail: 'Admin role required', requestId: c.get('requestId') as string });
  }

  const body = await c.req.json<{ spec: unknown }>();
  if (!body.spec) {
    throw new ApiError({ code: ErrorCode.VALIDATION_ERROR, detail: 'spec is required', requestId: c.get('requestId') as string });
  }

  const specStr = JSON.stringify(body.spec);
  if (specStr.length > 50_000) {
    throw new ApiError({ code: ErrorCode.VALIDATION_ERROR, detail: 'spec too large (max 50KB)', requestId: c.get('requestId') as string });
  }

  const db = createAuthenticatedClient(c.env, c.req.header('Authorization')!.slice(7));
  const registry = new SchemaRegistry(db, user.organizationId);

  const ctx = {
    sessionId: crypto.randomUUID(),
    userId: user.userId,
    organizationId: user.organizationId,
    role: user.role,
    requestId: c.get('requestId'),
  };

  const output = await schemaArchitectAgent.generateSchemaDiff(body.spec as any, ctx, c.env);
  const record = await registry.saveDraft(output, user.userId, ctx.sessionId);

  return c.json({ data: record }, 201);
});

/** POST /api/schema/:id/activate */
schema.post('/:id/activate', async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin') return c.json({ error: 'Forbidden' }, 403);
  const db = createAuthenticatedClient(c.env, c.req.header('Authorization')!.slice(7));
  const registry = new SchemaRegistry(db, user.organizationId);
  const data = await registry.activate(c.req.param('id'), user.userId);
  return c.json({ data });
});

/** POST /api/schema/:id/archive */
schema.post('/:id/archive', async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin') return c.json({ error: 'Forbidden' }, 403);
  const db = createAuthenticatedClient(c.env, c.req.header('Authorization')!.slice(7));
  const registry = new SchemaRegistry(db, user.organizationId);
  await registry.archive(c.req.param('id'));
  return c.json({ data: { success: true } });
});

export default schema;

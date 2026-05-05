// src/routes/drafts.ts
// Draft management routes — CRUD + commit + renew + cleanup

import { Hono } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware, writeMethodGuard } from '../middleware/auth';
import { getDbAndUser } from '../utils/query-helpers';
import { ApiError } from '../utils/api-error';
import { commitDraft } from '../utils/draft-commit';
import { buildToolSet } from '../tools/tool-registry';

const drafts = new Hono<{ Bindings: Env }>();
drafts.use('*', authMiddleware());
drafts.use('*', writeMethodGuard());

// GET /api/drafts — list pending drafts for current user
drafts.get('/', async (c) => {
  const { db, user } = getDbAndUser(c);
  const VALID_STATUSES = ['pending', 'committed', 'discarded', 'expired'] as const;
  const rawStatus = c.req.query('status') ?? 'pending';
  const status = (VALID_STATUSES as readonly string[]).includes(rawStatus) ? rawStatus : 'pending';
  const sessionId = c.req.query('session_id');

  let query = db
    .from('ai_drafts')
    .select('id, action_type, resource_type, target_id, summary, status, expires_at, renewed_count, created_at', { count: 'exact' })
    .eq('organization_id', user.organizationId)
    .eq('created_by', user.userId)
    .eq('status', status)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (sessionId) {
    query = query.eq('session_id', sessionId);
  }

  const { data, error, count } = await query;
  if (error) throw ApiError.database(error.message);

  return c.json({ data: data ?? [], total: count ?? 0 });
});

// GET /api/drafts/:id — full draft with content
drafts.get('/:id', async (c) => {
  const { db, user } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data, error } = await db
    .from('ai_drafts')
    .select('*')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .eq('created_by', user.userId)
    .is('deleted_at', null)
    .single();

  if (error || !data) throw ApiError.notFound('ai_drafts', id);

  return c.json({ data });
});

// PUT /api/drafts/:id — update draft content (user edits in drawer)
drafts.put('/:id', async (c) => {
  const { db, user } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json<{ content?: Record<string, unknown>; summary?: Record<string, unknown> }>();

  const updateFields: Record<string, unknown> = {};
  if (body.content) updateFields.content = body.content;
  if (body.summary) updateFields.summary = body.summary;

  if (Object.keys(updateFields).length === 0) {
    throw ApiError.badRequest('No fields to update');
  }

  const { data, error } = await db
    .from('ai_drafts')
    .update(updateFields)
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .eq('created_by', user.userId)
    .eq('status', 'pending')
    .is('deleted_at', null)
    .select('id, content, summary, updated_at')
    .single();

  if (error || !data) throw ApiError.notFound('ai_drafts', id);

  return c.json({ data });
});

// POST /api/drafts/:id/commit — execute real operation
drafts.post('/:id/commit', async (c) => {
  const { db, user } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json<{ content?: Record<string, unknown> }>().catch(() => ({ content: undefined }));

  const toolSet = buildToolSet({
    db,
    organizationId: user.organizationId,
    userId: user.userId,
    waitUntil: (p) => c.executionCtx.waitUntil(p as Promise<unknown>),
  });

  try {
    const result = await commitDraft({
      db,
      draftId: id,
      organizationId: user.organizationId,
      userId: user.userId,
      contentOverride: body.content,
      toolSet,
      waitUntil: (p) => c.executionCtx.waitUntil(p as Promise<unknown>),
    });

    return c.json({ data: result });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    const message = err instanceof Error ? err.message
      : (err && typeof err === 'object' && 'message' in err) ? String((err as { message: unknown }).message)
      : JSON.stringify(err);
    throw ApiError.database(`Draft commit failed: ${message}`);
  }
});

// POST /api/drafts/:id/discard — mark as discarded
drafts.post('/:id/discard', async (c) => {
  const { db, user } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data, error } = await db
    .from('ai_drafts')
    .update({ status: 'discarded', discarded_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .eq('created_by', user.userId)
    .eq('status', 'pending')
    .is('deleted_at', null)
    .select('id, status')
    .single();

  if (error || !data) throw ApiError.notFound('ai_drafts', id);

  return c.json({ data });
});

// POST /api/drafts/:id/renew — extend TTL +24h (max 3 renewals)
drafts.post('/:id/renew', async (c) => {
  const { db, user } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data: draft, error: fetchErr } = await db
    .from('ai_drafts')
    .select('renewed_count')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .eq('created_by', user.userId)
    .eq('status', 'pending')
    .is('deleted_at', null)
    .single();

  if (fetchErr || !draft) throw ApiError.notFound('ai_drafts', id);
  if (draft.renewed_count >= 3) {
    throw ApiError.badRequest('Maximum renewals reached (3)');
  }

  const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await db
    .from('ai_drafts')
    .update({ expires_at: newExpiry, renewed_count: draft.renewed_count + 1 })
    .eq('id', id)
    .eq('status', 'pending')
    .eq('organization_id', user.organizationId)
    .eq('created_by', user.userId)
    .select('id, expires_at, renewed_count')
    .single();

  if (error || !data) throw ApiError.database('Failed to renew draft');

  return c.json({ data });
});

// POST /api/drafts/cleanup — expire old drafts (cron/admin)
drafts.post('/cleanup', async (c) => {
  const { db } = getDbAndUser(c);

  const { data, error } = await db.rpc('cleanup_expired_drafts');
  if (error) throw ApiError.database(error.message);

  return c.json({ data: { expired_count: data } });
});

export default drafts;

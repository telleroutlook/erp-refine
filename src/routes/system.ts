// src/routes/system.ts
// System REST API — Document Attachments, Notifications

import { Hono } from 'hono';
import { z } from 'zod';
import type { Env } from '../types/env';
import { authMiddleware } from '../middleware/auth';
import { buildCrudRoutes, type CrudConfig } from '../utils/crud-factory';
import { getDbAndUser, parseRefineQuery } from '../utils/query-helpers';
import { ApiError } from '../utils/api-error';

const system = new Hono<{ Bindings: Env }>();
system.use('*', authMiddleware());

// ────────────────────────────────────────────────────────────────────────────
// Document Attachments — full CRUD
// Note: file_path is an R2 object key; upload via separate R2 presigned URL API
// ────────────────────────────────────────────────────────────────────────────

const documentAttachmentCreateSchema = z.object({
  entity_type: z.string().min(1).max(100),
  entity_id: z.string().uuid(),
  file_name: z.string().min(1).max(500),
  file_path: z.string().min(1).max(1000),
  file_size: z.number().int().nonnegative().optional(),
  mime_type: z.string().max(200).optional(),
});

const documentAttachmentsConfig: CrudConfig = {
  table: 'document_attachments',
  path: '/document-attachments',
  resourceName: 'DocumentAttachment',
  listSelect: 'id, entity_type, entity_id, file_name, file_path, file_size, mime_type, uploaded_by, created_at',
  detailSelect: '*',
  createReturnSelect: 'id, file_name, file_path',
  defaultSort: 'created_at',
  softDelete: false,
  orgScoped: true,
  createSchema: documentAttachmentCreateSchema,
};
system.route('', buildCrudRoutes(documentAttachmentsConfig));

// ────────────────────────────────────────────────────────────────────────────
// Notifications — list + mark-read; no external create (created by system)
// ────────────────────────────────────────────────────────────────────────────

// GET list — scoped to current user's employee record
system.get('/notifications', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c, 'created_at');

  const { data: emp } = await db
    .from('employees')
    .select('id')
    .eq('organization_id', user.organizationId)
    .eq('user_id', user.userId)
    .single();

  if (!emp) return c.json({ data: [], total: 0, page, pageSize });

  const { data, count, error } = await db
    .from('notifications')
    .select('id, title, body, notification_type, entity_type, entity_id, is_read, read_at, created_at', { count: 'exact' })
    .eq('organization_id', user.organizationId)
    .eq('recipient_id', emp.id)
    .order(sortField, { ascending: sortOrder === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw ApiError.database(error.message, c.get('requestId'));
  return c.json({ data: data ?? [], total: count ?? 0, page, pageSize });
});

// GET detail
system.get('/notifications/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data: emp } = await db
    .from('employees')
    .select('id')
    .eq('organization_id', user.organizationId)
    .eq('user_id', user.userId)
    .single();

  if (!emp) throw ApiError.notFound('Notification', id, requestId);

  const { data, error } = await db
    .from('notifications')
    .select('id, title, body, notification_type, entity_type, entity_id, is_read, read_at, created_at')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .eq('recipient_id', emp.id)
    .single();

  if (error || !data) throw ApiError.notFound('Notification', id, requestId);
  return c.json({ data });
});

// POST /notifications/:id/read — mark a notification as read
system.post('/notifications/:id/read', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data: emp } = await db
    .from('employees')
    .select('id')
    .eq('organization_id', user.organizationId)
    .eq('user_id', user.userId)
    .single();

  if (!emp) throw ApiError.notFound('Notification', id, requestId);

  const { data, error } = await db
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .eq('recipient_id', emp.id)
    .select('id, is_read, read_at')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('Notification', id, requestId);
  return c.json({ data });
});

// POST /notifications/read-all — mark all notifications as read for current user
system.post('/notifications/read-all', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);

  const { data: emp } = await db
    .from('employees')
    .select('id')
    .eq('organization_id', user.organizationId)
    .eq('user_id', user.userId)
    .single();

  if (!emp) return c.json({ data: { success: true } });

  const { error } = await db
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('organization_id', user.organizationId)
    .eq('recipient_id', emp.id)
    .eq('is_read', false);

  if (error) throw ApiError.database(error.message, requestId);
  return c.json({ data: { success: true } });
});

export default system;

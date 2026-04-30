// src/routes/storage.ts
// R2 Storage REST API — file upload, download, and deletion via R2 proxy

import { Hono } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware, writeMethodGuard } from '../middleware/auth';
import { getDbAndUser } from '../utils/query-helpers';
import { ApiError } from '../utils/api-error';
import { ErrorCode } from '../types/errors';

const storage = new Hono<{ Bindings: Env }>();
storage.use('*', authMiddleware());
storage.use('*', writeMethodGuard());

// ---------------------------------------------------------------------------
// POST /storage/upload — multipart upload to R2 + create document_attachments
// ---------------------------------------------------------------------------
storage.post('/storage/upload', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);

  const body = await c.req.parseBody();
  const file = body['file'];
  if (!file || typeof file === 'string') {
    throw new ApiError({
      code: ErrorCode.VALIDATION_ERROR,
      detail: 'Missing "file" field in multipart form data.',
      requestId,
    });
  }

  const entityType = typeof body['entity_type'] === 'string' ? body['entity_type'] : '';
  const entityId = typeof body['entity_id'] === 'string' ? body['entity_id'] : '';
  if (!entityType || !entityId) {
    throw new ApiError({
      code: ErrorCode.VALIDATION_ERROR,
      detail: 'Both "entity_type" and "entity_id" are required.',
      requestId,
    });
  }

  const fileId = crypto.randomUUID();
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
  if (file.size > MAX_FILE_SIZE) {
    throw new ApiError({
      code: ErrorCode.VALIDATION_ERROR,
      detail: `File size exceeds maximum allowed size of 100 MB.`,
      requestId,
    });
  }
  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const safeEntityType = entityType.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  const safeEntityId = entityId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  const r2Key = `${user.organizationId}/${safeEntityType}/${safeEntityId}/${fileId}_${safeFileName}`;

  await c.env.STORAGE.put(r2Key, file.stream(), {
    httpMetadata: { contentType: file.type },
    customMetadata: {
      organizationId: user.organizationId,
      entityType,
      entityId,
      uploadedBy: user.userId,
    },
  });

  const { data, error } = await db
    .from('document_attachments')
    .insert({
      organization_id: user.organizationId,
      entity_type: entityType,
      entity_id: entityId,
      file_name: file.name,
      file_path: r2Key,
      file_size: file.size,
      mime_type: file.type || null,
      uploaded_by: user.userId,
    })
    .select('id, file_name, file_path, file_size, mime_type, created_at')
    .single();

  if (error) {
    await c.env.STORAGE.delete(r2Key);
    throw ApiError.database(error.message, requestId);
  }

  return c.json({ data }, 201);
});

// ---------------------------------------------------------------------------
// GET /storage/download/:id — stream file from R2
// ---------------------------------------------------------------------------
storage.get('/storage/download/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data: attachment, error } = await db
    .from('document_attachments')
    .select('id, file_name, file_path, mime_type')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (error || !attachment) throw ApiError.notFound('DocumentAttachment', id, requestId);

  const object = await c.env.STORAGE.get(attachment.file_path);
  if (!object) {
    throw new ApiError({
      code: ErrorCode.NOT_FOUND,
      detail: `File not found in storage for attachment ${id}.`,
      requestId,
    });
  }

  c.header('Content-Type', attachment.mime_type || 'application/octet-stream');
  const safeFileName = (attachment.file_name ?? 'download').replace(/[^\w.\- ]/g, '_');
  c.header('Content-Disposition', `attachment; filename="${safeFileName}"`);
  if (object.size) c.header('Content-Length', String(object.size));

  return c.body(object.body as ReadableStream);
});

// ---------------------------------------------------------------------------
// DELETE /storage/:id — delete R2 object + soft-delete attachment record
// ---------------------------------------------------------------------------
storage.delete('/storage/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data: attachment, error: fetchError } = await db
    .from('document_attachments')
    .select('id, file_path')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (fetchError || !attachment) throw ApiError.notFound('DocumentAttachment', id, requestId);

  const { error: deleteError } = await db
    .from('document_attachments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null);

  if (deleteError) throw ApiError.database(deleteError.message, requestId);

  await c.env.STORAGE.delete(attachment.file_path).catch(() => {});

  return c.json({ data: { success: true } });
});

export default storage;

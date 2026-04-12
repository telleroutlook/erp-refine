// src/routes/admin.ts
// Admin REST API — Approval Rules, Approval Records, Notifications, Data Import

import { Hono } from 'hono';
import type { Context, Next } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware } from '../middleware/auth';
import { buildCrudRoutes, type CrudConfig } from '../utils/crud-factory';
import { getDbAndUser, parseRefineQuery } from '../utils/query-helpers';
import { ApiError } from '../utils/api-error';
import { ErrorCode } from '../types/errors';

const admin = new Hono<{ Bindings: Env }>();
admin.use('*', authMiddleware());

// ---------------------------------------------------------------------------
// Admin role check middleware — only users with role 'admin' can access
// ---------------------------------------------------------------------------
admin.use('*', async (c: Context<{ Bindings: Env }>, next: Next) => {
  const user = c.get('user');
  if (user.role !== 'admin') {
    throw new ApiError({
      code: ErrorCode.FORBIDDEN,
      detail: 'Admin access required. Your current role does not have permission to access this resource.',
      requestId: c.get('requestId'),
      hint: 'Contact your organization administrator to request admin access.',
    });
  }
  await next();
});

// ---------------------------------------------------------------------------
// Approval Rules — full CRUD, no soft delete
// ---------------------------------------------------------------------------
const approvalRulesConfig: CrudConfig = {
  table: 'approval_rules',
  path: '/approval-rules',
  resourceName: 'ApprovalRule',
  listSelect:
    'id, entity_type, condition_field, condition_operator, condition_value, approver_role, step_order, is_active',
  detailSelect: '*',
  createReturnSelect: 'id, entity_type, approver_role, step_order',
  defaultSort: 'entity_type',
  softDelete: false,
  orgScoped: true,
};

const approvalRulesRouter = buildCrudRoutes(approvalRulesConfig);
admin.route('', approvalRulesRouter);

// ---------------------------------------------------------------------------
// Approval Records — read-only (list + show)
// ---------------------------------------------------------------------------
const approvalRecordsConfig: CrudConfig = {
  table: 'approval_records',
  path: '/approval-records',
  resourceName: 'ApprovalRecord',
  listSelect:
    'id, entity_type, entity_id, step_no, action, created_at, approver:employees(id, name)',
  detailSelect: '*, approver:employees(id, name, email)',
  createReturnSelect: 'id',
  defaultSort: 'created_at',
  softDelete: false,
  orgScoped: true,
  disableCreate: true,
  disableUpdate: true,
  disableDelete: true,
};

const approvalRecordsRouter = buildCrudRoutes(approvalRecordsConfig);
admin.route('', approvalRecordsRouter);

// ---------------------------------------------------------------------------
// Notifications — CRUD + custom mark-as-read endpoint, no soft delete
// ---------------------------------------------------------------------------
const notificationsConfig: CrudConfig = {
  table: 'notifications',
  path: '/notifications',
  resourceName: 'Notification',
  listSelect:
    'id, title, body, notification_type, is_read, created_at, entity_type, entity_id',
  detailSelect: '*',
  createReturnSelect: 'id, title, notification_type',
  defaultSort: 'created_at',
  softDelete: false,
  orgScoped: true,
};

const notificationsRouter = buildCrudRoutes(notificationsConfig);
admin.route('', notificationsRouter);

// Custom: mark notification as read
admin.put('/notifications/:id/read', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data, error } = await db
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .select('id, is_read')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('Notification', id, requestId);
  return c.json({ data });
});

// ---------------------------------------------------------------------------
// Data Import
// ---------------------------------------------------------------------------
import {
  importEntity,
  importBatch,
  getSupportedEntities,
  getImportOrder,
  ENTITY_CONFIGS,
  type ImportOptions,
} from '../utils/import-engine';

/** GET /import — list supported entities and their import order */
admin.get('/import', async (c) => {
  const entities = getSupportedEntities();
  const order = getImportOrder(entities);
  const details = Object.fromEntries(
    entities.map((e) => {
      const cfg = ENTITY_CONFIGS[e]!;
      return [e, { table: cfg.table, requiredFields: cfg.requiredFields, uniqueKey: cfg.uniqueKey }];
    })
  );
  return c.json({
    data: {
      supportedEntities: entities,
      recommendedOrder: order,
      entities: details,
    },
  });
});

/** POST /import/:entity — import records for a single entity */
admin.post('/import/:entity', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const entity = c.req.param('entity');
  const body = await c.req.json();

  const records = body.records;
  if (!Array.isArray(records)) {
    throw new ApiError({
      code: ErrorCode.VALIDATION_ERROR,
      detail: "Request body must contain a 'records' array.",
      requestId,
      hint: 'Format: { "records": [...], "options": { "upsert": false, "dry_run": false, "on_error": "skip" } }',
    });
  }

  const options: ImportOptions = {
    upsert: body.options?.upsert ?? false,
    dryRun: body.options?.dry_run ?? false,
    onError: body.options?.on_error ?? 'skip',
  };

  const result = await importEntity(entity, records, {
    organizationId: user.organizationId,
    userId: user.userId,
    db,
  }, options);

  const status = result.errors.length > 0 ? 207 : 200;
  return c.json({ data: result }, status as any);
});

/** POST /import-batch — import multiple entities in dependency order */
admin.post('/import-batch', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const body = await c.req.json();

  const data = body.data;
  if (!data || typeof data !== 'object') {
    throw new ApiError({
      code: ErrorCode.VALIDATION_ERROR,
      detail: "Request body must contain a 'data' object keyed by entity name.",
      requestId,
      hint: 'Format: { "data": { "products": [...], "customers": [...] }, "options": {...} }',
    });
  }

  const options: ImportOptions = {
    upsert: body.options?.upsert ?? false,
    dryRun: body.options?.dry_run ?? false,
    onError: body.options?.on_error ?? 'skip',
  };

  const results = await importBatch(data, {
    organizationId: user.organizationId,
    userId: user.userId,
    db,
  }, options);

  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const status = totalErrors > 0 ? 207 : 200;
  return c.json({ data: { results, totalImported: results.reduce((s, r) => s + r.imported, 0), totalErrors } }, status as any);
});

export default admin;

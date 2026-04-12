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
// Data Import — placeholder (Phase 8)
// ---------------------------------------------------------------------------
admin.post('/import/:entity', async (c) => {
  // Phase 8 implementation
  return c.json({ data: { message: 'Import endpoint not yet implemented' } }, 501);
});

export default admin;

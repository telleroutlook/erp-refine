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
import {
  approval_rules, approval_records, approval_rule_steps, role_permissions,
} from '../schema/columns';

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
    'id, rule_name, document_type, min_amount, max_amount, required_roles, sequence_order, is_active',
  detailSelect: approval_rules.join(', '),
  createReturnSelect: 'id, rule_name, document_type, sequence_order',
  defaultSort: 'document_type',
  softDelete: true,
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
    'id, document_type, document_id, rule_id, decision_level, decision_by, decision_at, status, created_at',
  detailSelect: approval_records.join(', '),
  createReturnSelect: 'id',
  defaultSort: 'created_at',
  softDelete: true,
  orgScoped: true,
  disableCreate: true,
  disableUpdate: true,
  disableDelete: true,
};

const approvalRecordsRouter = buildCrudRoutes(approvalRecordsConfig);
admin.route('', approvalRecordsRouter);

// ---------------------------------------------------------------------------
// Approval Rule Steps — steps within approval rules
// ---------------------------------------------------------------------------
const approvalRuleStepsConfig: CrudConfig = {
  table: 'approval_rule_steps',
  path: '/approval-rule-steps',
  resourceName: 'ApprovalRuleStep',
  listSelect: 'id, rule_id, step_order, approval_type, approver_role, min_approvers, timeout_hours, created_at',
  detailSelect: approval_rule_steps.join(', '),
  createReturnSelect: 'id, rule_id, step_order',
  defaultSort: 'step_order',
  softDelete: false,
  orgScoped: false,
  parentOwnership: { parentFk: 'rule_id', parentTable: 'approval_rules' },
};
admin.route('', buildCrudRoutes(approvalRuleStepsConfig));

// ---------------------------------------------------------------------------
// Roles — RBAC role management
// ---------------------------------------------------------------------------
const rolesConfig: CrudConfig = {
  table: 'roles',
  path: '/roles',
  resourceName: 'Role',
  listSelect: 'id, name, description, is_system, created_at, updated_at',
  detailSelect: '*, permissions:role_permissions(id, resource, action, conditions)',
  createReturnSelect: 'id, name',
  defaultSort: 'name',
  softDelete: false,
  orgScoped: true,
};
admin.route('', buildCrudRoutes(rolesConfig));

// ---------------------------------------------------------------------------
// Role Permissions — permissions per role
// ---------------------------------------------------------------------------
const rolePermissionsConfig: CrudConfig = {
  table: 'role_permissions',
  path: '/role-permissions',
  resourceName: 'RolePermission',
  listSelect: 'id, role_id, resource, action, conditions, created_at',
  detailSelect: role_permissions.join(', '),
  createReturnSelect: 'id, role_id, resource, action',
  defaultSort: 'resource',
  softDelete: false,
  orgScoped: false,
  parentOwnership: { parentFk: 'role_id', parentTable: 'roles' },
};
admin.route('', buildCrudRoutes(rolePermissionsConfig));

// ---------------------------------------------------------------------------
// User Roles — assign roles to users
// ---------------------------------------------------------------------------
const userRolesConfig: CrudConfig = {
  table: 'user_roles',
  path: '/user-roles',
  resourceName: 'UserRole',
  listSelect: 'id, user_id, role_id, assigned_by, assigned_at, role:roles(id,name)',
  detailSelect: '*, role:roles(id,name,description)',
  createReturnSelect: 'id, user_id, role_id',
  defaultSort: 'assigned_at',
  softDelete: false,
  orgScoped: true,
};
admin.route('', buildCrudRoutes(userRolesConfig));

// ---------------------------------------------------------------------------
// Link Employees to Auth Users — needed for RLS to work after seed import
// ---------------------------------------------------------------------------
admin.post('/link-employees', async (c) => {
  const { user, requestId } = getDbAndUser(c);
  const serviceDb = createServiceClient(c.env);
  const body = await c.req.json();

  const mappings: Array<{ employee_email: string; auth_email: string }> = body.mappings ?? [];
  if (!Array.isArray(mappings) || mappings.length === 0) {
    throw new ApiError({
      code: ErrorCode.VALIDATION_ERROR,
      detail: "Request body must contain a 'mappings' array of { employee_email, auth_email }.",
      requestId,
    });
  }
  if (mappings.length > 200) {
    throw new ApiError({
      code: ErrorCode.VALIDATION_ERROR,
      detail: 'Maximum 200 mappings per request.',
      requestId,
    });
  }

  const results = await Promise.all(
    mappings.map(async (m: { employee_email: string; auth_email: string }) => {
      const { data, error } = await serviceDb.rpc('link_employee_to_auth', {
        p_employee_email: m.employee_email,
        p_auth_email: m.auth_email,
        p_org_id: user.organizationId,
      });
      if (error) {
        console.error('[admin] link failed:', error.message);
        return { ok: false, employee_email: m.employee_email, message: 'Link operation failed' };
      }
      if (!data) return { ok: false, employee_email: m.employee_email, message: `Auth user '${m.auth_email}' not found` };
      return { ok: true, employee_email: m.employee_email };
    })
  );

  const linked = results.filter((r) => r.ok).length;
  const errors = results.filter((r) => !r.ok).map(({ employee_email, message }) => ({ employee_email, message: message! }));

  return c.json({ data: { linked, errors } });
});

// ---------------------------------------------------------------------------
// Data Import — uses service role client to bypass RLS for bulk operations
// ---------------------------------------------------------------------------
import {
  importEntity,
  importBatch,
  getSupportedEntities,
  getImportOrder,
  ENTITY_CONFIGS,
  type ImportOptions,
} from '../utils/import-engine';
import { createServiceClient } from '../utils/supabase';

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
  const { user, requestId } = getDbAndUser(c);
  const serviceDb = createServiceClient(c.env);
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

  const MAX_IMPORT_RECORDS = 5000;
  if (records.length > MAX_IMPORT_RECORDS) {
    throw new ApiError({
      code: ErrorCode.VALIDATION_ERROR,
      detail: `Maximum ${MAX_IMPORT_RECORDS} records per import request. Received ${records.length}.`,
      requestId,
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
    db: serviceDb,
  }, options);

  const status = result.errors.length > 0 ? 207 : 200;
  return c.json({ data: result }, status as any);
});

/** POST /import-batch — import multiple entities in dependency order */
admin.post('/import-batch', async (c) => {
  const { user, requestId } = getDbAndUser(c);
  const serviceDb = createServiceClient(c.env);
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
    db: serviceDb,
  }, options);

  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const status = totalErrors > 0 ? 207 : 200;
  return c.json({ data: { results, totalImported: results.reduce((s, r) => s + r.imported, 0), totalErrors } }, status as any);
});

/** GET /import/templates — list all entity schemas for onboarding */
admin.get('/import/templates', async (c) => {
  const entities = getSupportedEntities();
  const templates = entities.map((e) => {
    const cfg = ENTITY_CONFIGS[e]!;
    return {
      entity: e,
      table: cfg.table,
      requiredFields: cfg.requiredFields,
      uniqueKey: cfg.uniqueKey,
      references: cfg.references,
      orgScoped: cfg.orgScoped ?? true,
    };
  });
  return c.json({ data: templates });
});

/** GET /import/templates/:entity — download CSV template for a specific entity */
admin.get('/import/templates/:entity', async (c) => {
  const entity = c.req.param('entity');
  const config = ENTITY_CONFIGS[entity];
  if (!config) {
    throw ApiError.notFound('ImportTemplate', entity, c.get('requestId'));
  }

  const allFields = [...new Set([
    ...config.requiredFields,
    ...(config.uniqueKey?.filter((k) => k !== 'organization_id') ?? []),
  ])];
  const headerLine = allFields.join(',');
  const exampleLine = allFields.map((f) => `<${f}>`).join(',');
  const csv = `${headerLine}\n# Required fields: ${config.requiredFields.join(', ')}\n${exampleLine}\n`;

  c.header('Content-Type', 'text/csv');
  c.header('Content-Disposition', `attachment; filename=${entity}-template.csv`);
  return c.body(csv);
});

export default admin;

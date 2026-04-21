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
    'id, rule_name, entity_type, condition_field, condition_operator, condition_value, approver_role, step_order, is_active',
  detailSelect: '*',
  createReturnSelect: 'id, rule_name, entity_type, step_order',
  defaultSort: 'entity_type',
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
    'id, entity_type, entity_id, rule_id, step_no, approver_id, action, acted_at, created_at',
  detailSelect: '*',
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

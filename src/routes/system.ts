// src/routes/system.ts
// System REST API — Document Attachments, Notifications

import { Hono } from 'hono';
import { z } from 'zod';
import type { Env } from '../types/env';
import { authMiddleware, writeMethodGuard } from '../middleware/auth';
import { buildCrudRoutes, type CrudConfig } from '../utils/crud-factory';
import { getDbAndUser, parseRefineQuery, parseRefineFilters } from '../utils/query-helpers';
import { applyFilters } from '../utils/database';
import { ApiError } from '../utils/api-error';
import {
  document_attachments, document_relations, workflows,
  message_feedback, approval_records, workflow_steps, dynamic_form_data,
} from '../schema/columns';

const system = new Hono<{ Bindings: Env }>();
system.use('*', authMiddleware());
system.use('*', writeMethodGuard());

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
  detailSelect: document_attachments.join(', '),
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

  const filters = parseRefineFilters(c);
  let query = db
    .from('notifications')
    .select('id, title, body, notification_type, entity_type, entity_id, is_read, read_at, created_at', { count: 'exact' })
    .eq('organization_id', user.organizationId)
    .eq('recipient_id', emp.id);
  query = applyFilters(query, filters);

  const { data, count, error } = await query
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

// ────────────────────────────────────────────────────────────────────────────
// Document Relations — cross-entity linking (e.g. PO → Receipt → Invoice)
// ────────────────────────────────────────────────────────────────────────────

// Document type metadata for BFS chain display data enrichment
const DOC_TABLE: Record<string, string> = {
  purchase_requisition: 'purchase_requisitions',
  purchase_order: 'purchase_orders',
  purchase_receipt: 'purchase_receipts',
  sales_order: 'sales_orders',
  sales_shipment: 'sales_shipments',
  sales_return: 'sales_returns',
  supplier_invoice: 'supplier_invoices',
  sales_invoice: 'sales_invoices',
  payment_request: 'payment_requests',
  payment_record: 'payment_records',
  customer_receipt: 'customer_receipts',
  voucher: 'vouchers',
  quality_inspection: 'quality_inspections',
  work_order: 'work_orders',
  budget: 'budgets',
  contract: 'contracts',
  fixed_asset: 'fixed_assets',
};
const DOC_NUMBER_FIELD: Record<string, string> = {
  purchase_requisition: 'requisition_number',
  purchase_order: 'order_number',
  purchase_receipt: 'receipt_number',
  sales_order: 'order_number',
  sales_shipment: 'shipment_number',
  sales_return: 'return_number',
  supplier_invoice: 'invoice_number',
  sales_invoice: 'invoice_number',
  payment_request: 'request_number',
  payment_record: 'payment_number',
  customer_receipt: 'receipt_number',
  voucher: 'voucher_number',
  quality_inspection: 'inspection_number',
  work_order: 'work_order_number',
  budget: 'budget_name',
  contract: 'contract_number',
  fixed_asset: 'asset_code',
};
const DOC_AMOUNT_FIELD: Record<string, string | null> = {
  purchase_requisition: null,
  purchase_order: 'total_amount',
  purchase_receipt: null,
  sales_order: 'total_amount',
  sales_shipment: null,
  sales_return: 'total_amount',
  supplier_invoice: 'total_amount',
  sales_invoice: 'total_amount',
  payment_request: 'amount',
  payment_record: 'amount',
  customer_receipt: 'amount',
  voucher: 'total_debit',
  quality_inspection: null,
  work_order: null,
  budget: 'total_amount',
  contract: 'total_amount',
  fixed_asset: null,
};

// GET /document-relations/chain/:objectType/:objectId
// BFS traversal in both directions to build the full document chain graph.
system.get('/document-relations/chain/:objectType/:objectId', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const focalType = c.req.param('objectType');
  const focalId = c.req.param('objectId');
  const orgId = user.organizationId;
  const MAX_DEPTH = 8;
  const MAX_NODES = 100;

  if (!DOC_TABLE[focalType]) {
    throw ApiError.badRequest(`Unknown document type: ${focalType}`, requestId);
  }
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(focalId)) {
    throw ApiError.badRequest('objectId must be a valid UUID', requestId);
  }

  // Verify focal document belongs to caller's org
  const focalTable = DOC_TABLE[focalType];
  const { data: focalCheck, error: focalErr } = await db
    .from(focalTable as any)
    .select('id')
    .eq('id', focalId)
    .eq('organization_id', orgId)
    .maybeSingle();
  if (focalErr || !focalCheck) {
    throw ApiError.notFound(focalType, focalId, requestId);
  }

  // BFS both directions — batch-by-level to minimize DB round trips
  const visitedNodes = new Set<string>();
  const allRelations = new Map<string, { id: string; from_object_type: string; from_object_id: string; to_object_type: string; to_object_id: string; label: string | null }>();
  let frontier: Array<{ type: string; id: string }> = [
    { type: focalType, id: focalId },
  ];
  visitedNodes.add(`${focalType}:${focalId}`);
  let depth = 0;

  while (frontier.length > 0 && depth < MAX_DEPTH && visitedNodes.size < MAX_NODES) {
    // Build composite OR filter to avoid cross-join false positives
    const outFilter = frontier
      .map(f => `and(from_object_type.eq.${f.type},from_object_id.eq.${f.id})`)
      .join(',');
    const inFilter = frontier
      .map(f => `and(to_object_type.eq.${f.type},to_object_id.eq.${f.id})`)
      .join(',');

    const [outRes, inRes] = await Promise.all([
      db.from('document_relations')
        .select('id, from_object_type, from_object_id, to_object_type, to_object_id, label')
        .eq('organization_id', orgId)
        .or(outFilter),
      db.from('document_relations')
        .select('id, from_object_type, from_object_id, to_object_type, to_object_id, label')
        .eq('organization_id', orgId)
        .or(inFilter),
    ]);

    const nextFrontier: Array<{ type: string; id: string }> = [];

    for (const rel of [...(outRes.data ?? []), ...(inRes.data ?? [])]) {
      if (allRelations.has(rel.id)) continue;
      allRelations.set(rel.id, rel);

      const targetKey = `${rel.to_object_type}:${rel.to_object_id}`;
      if (!visitedNodes.has(targetKey) && visitedNodes.size < MAX_NODES
          && DOC_TABLE[rel.to_object_type] && UUID_RE.test(rel.to_object_id)) {
        visitedNodes.add(targetKey);
        nextFrontier.push({ type: rel.to_object_type, id: rel.to_object_id });
      }

      const sourceKey = `${rel.from_object_type}:${rel.from_object_id}`;
      if (!visitedNodes.has(sourceKey) && visitedNodes.size < MAX_NODES
          && DOC_TABLE[rel.from_object_type] && UUID_RE.test(rel.from_object_id)) {
        visitedNodes.add(sourceKey);
        nextFrontier.push({ type: rel.from_object_type, id: rel.from_object_id });
      }
    }

    frontier = nextFrontier;
    depth++;
  }

  // Group node IDs by type for batch display data fetching
  const typeGroups = new Map<string, string[]>();
  for (const key of visitedNodes) {
    const colonIdx = key.indexOf(':');
    const type = key.slice(0, colonIdx);
    const id = key.slice(colonIdx + 1);
    if (!typeGroups.has(type)) typeGroups.set(type, []);
    typeGroups.get(type)!.push(id);
  }

  // Parallel batch fetch display data per document type
  const displayData = new Map<string, { label: string; date: string | null; amount: number | null; status: string | null }>();
  await Promise.all([...typeGroups.entries()].map(async ([type, ids]) => {
    const table = DOC_TABLE[type];
    const numberField = DOC_NUMBER_FIELD[type];
    const amountField = DOC_AMOUNT_FIELD[type] ?? null;
    if (!table || !numberField) return;

    const selectFields = ['id', numberField, 'status', 'created_at', amountField]
      .filter((f): f is string => f !== null)
      .join(', ');

    const { data, error } = await db.from(table as any).select(selectFields).in('id', ids).eq('organization_id', orgId);
    if (error) return;
    for (const row of (data ?? []) as unknown as Array<Record<string, unknown>>) {
      displayData.set(`${type}:${row.id}`, {
        label: String(row[numberField] ?? row.id),
        date: (row.created_at as string | null) ?? null,
        amount: amountField ? ((row[amountField] as number | null) ?? null) : null,
        status: (row.status as string | null) ?? null,
      });
    }
  }));

  const nodes = [...visitedNodes].map(key => {
    const colonIdx = key.indexOf(':');
    const type = key.slice(0, colonIdx);
    const id = key.slice(colonIdx + 1);
    const display = displayData.get(key) ?? { label: id, date: null, amount: null, status: null };
    return { id: key, objectType: type, objectId: id, isFocal: (type === focalType && id === focalId), ...display };
  });

  const edges = [...allRelations.values()].map(r => ({
    id: r.id,
    fromObjectType: r.from_object_type,
    fromObjectId: r.from_object_id,
    toObjectType: r.to_object_type,
    toObjectId: r.to_object_id,
    label: r.label ?? `${r.from_object_type} → ${r.to_object_type}`,
  }));

  return c.json({ data: { nodes, edges } });
});

const documentRelationsConfig: CrudConfig = {
  table: 'document_relations',
  path: '/document-relations',
  resourceName: 'DocumentRelation',
  listSelect: 'id, from_object_type, from_object_id, to_object_type, to_object_id, relation_type, label, created_at',
  detailSelect: document_relations.join(', '),
  createReturnSelect: 'id, relation_type',
  defaultSort: 'created_at',
  softDelete: false,
  orgScoped: true,
};
system.route('', buildCrudRoutes(documentRelationsConfig));

// ────────────────────────────────────────────────────────────────────────────
// Workflows — read-only workflow state tracking
// ────────────────────────────────────────────────────────────────────────────

const workflowsConfig: CrudConfig = {
  table: 'workflows',
  path: '/workflows',
  resourceName: 'Workflow',
  listSelect: 'id, workflow_type, entity_type, entity_id, status, current_step, started_by, started_at, completed_at, created_at',
  detailSelect: workflows.join(', '),
  createReturnSelect: 'id',
  defaultSort: 'created_at',
  softDelete: false,
  orgScoped: true,
  disableCreate: true,
  disableUpdate: true,
  disableDelete: true,
};
system.route('', buildCrudRoutes(workflowsConfig));

// ────────────────────────────────────────────────────────────────────────────
// Message Feedback — create + list (no update/delete)
// ────────────────────────────────────────────────────────────────────────────

const messageFeedbackConfig: CrudConfig = {
  table: 'message_feedback',
  path: '/message-feedback',
  resourceName: 'MessageFeedback',
  listSelect: 'id, session_id, message_id, user_id, feedback, comment, created_at',
  detailSelect: message_feedback.join(', '),
  createReturnSelect: 'id, feedback',
  defaultSort: 'created_at',
  softDelete: false,
  orgScoped: true,
  disableUpdate: true,
  disableDelete: true,
};
system.route('', buildCrudRoutes(messageFeedbackConfig));

// ────────────────────────────────────────────────────────────────────────────
// Approval Records — read-only (list + show)
// ────────────────────────────────────────────────────────────────────────────

const approvalRecordsConfig: CrudConfig = {
  table: 'approval_records',
  path: '/approval-records',
  resourceName: 'ApprovalRecord',
  listSelect:
    'id, document_type, document_id, rule_id, decision_level, decision_by, decision_at, status, comments, created_at',
  detailSelect: approval_records.join(', '),
  createReturnSelect: 'id',
  defaultSort: 'created_at',
  softDelete: true,
  orgScoped: true,
  disableCreate: true,
  disableUpdate: true,
  disableDelete: true,
};
system.route('', buildCrudRoutes(approvalRecordsConfig));

// ────────────────────────────────────────────────────────────────────────────
// Workflow Steps — individual steps within a workflow
// ────────────────────────────────────────────────────────────────────────────

const workflowStepsConfig: CrudConfig = {
  table: 'workflow_steps',
  path: '/workflow-steps',
  resourceName: 'WorkflowStep',
  listSelect: 'id, workflow_id, step_name, step_order, step_type, assignee_role, status, completed_by, completed_at, created_at',
  detailSelect: workflow_steps.join(', '),
  createReturnSelect: 'id, workflow_id, step_order',
  defaultSort: 'step_order',
  softDelete: false,
  orgScoped: false,
  parentOwnership: { parentFk: 'workflow_id', parentTable: 'workflows' },
};
system.route('', buildCrudRoutes(workflowStepsConfig));

// ────────────────────────────────────────────────────────────────────────────
// Dynamic Form Data — AI-generated form data storage
// ────────────────────────────────────────────────────────────────────────────

const dynamicFormDataConfig: CrudConfig = {
  table: 'dynamic_form_data',
  path: '/dynamic-form-data',
  resourceName: 'DynamicFormData',
  listSelect: 'id, schema_registry_id, is_sandbox, created_by, created_at',
  detailSelect: dynamic_form_data.join(', '),
  createReturnSelect: 'id, schema_registry_id, is_sandbox',
  defaultSort: 'created_at',
  softDelete: true,
  orgScoped: true,
};
system.route('', buildCrudRoutes(dynamicFormDataConfig));

export default system;

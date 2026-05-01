// src/utils/draft-helpers.ts
// Utility functions for saving and managing AI drafts

import type { SupabaseClient } from '@supabase/supabase-js';
import { TOOL_REGISTRY_META } from '../tools/tool-registry';

export interface DraftSummary {
  title: string;
  subtitle: string;
  amount?: number;
  currency?: string;
  items_count?: number;
  key_fields: Array<{ label: string; value: string }>;
}

export interface SaveDraftParams {
  db: SupabaseClient;
  organizationId: string;
  userId: string;
  sessionId: string;
  toolName: string;
  toolArgs: Record<string, unknown>;
  actionType: 'create' | 'update' | 'status_change';
  resourceType: string;
  targetId?: string;
  content: Record<string, unknown>;
  originalContent?: Record<string, unknown>;
  summary: DraftSummary;
}

export interface SaveDraftResult {
  id: string;
  summary: DraftSummary;
  action_type: string;
  resource_type: string;
}

export async function saveDraft(params: SaveDraftParams): Promise<SaveDraftResult> {
  const { db, organizationId, userId, sessionId, toolName, toolArgs, actionType, resourceType, targetId, content, originalContent, summary } = params;

  const { data, error } = await db
    .from('ai_drafts')
    .insert({
      organization_id: organizationId,
      created_by: userId,
      session_id: sessionId,
      action_type: actionType,
      resource_type: resourceType,
      target_id: targetId ?? null,
      content,
      original_content: originalContent ?? null,
      tool_name: toolName,
      tool_args: toolArgs,
      summary,
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Failed to save draft: ${error?.message ?? 'unknown error'}`);
  }

  return {
    id: data.id as string,
    summary,
    action_type: actionType,
    resource_type: resourceType,
  };
}

const RESOURCE_MAP: Record<string, string> = {
  purchase_order: 'purchase_orders',
  purchase_requisition: 'purchase_requisitions',
  sales_order: 'sales_orders',
  sales_shipment: 'sales_shipments',
  quality_inspection: 'quality_inspections',
  work_order: 'work_orders',
  voucher: 'vouchers',
  payment_request: 'payment_requests',
  contract: 'contracts',
  stock: 'stock_levels',
};

export function inferResourceType(toolName: string): string {
  const meta = TOOL_REGISTRY_META.find((m) => m.name === toolName);
  if (meta) {
    for (const [key, resource] of Object.entries(RESOURCE_MAP)) {
      if (toolName.includes(key)) return resource;
    }
  }
  const match = toolName.match(/(?:create|update|submit|approve|reject|cancel|confirm|activate|terminate|renew|complete|void|issue|receive|transfer)_(.+)/);
  if (match && match[1]) {
    const suffix = match[1];
    return RESOURCE_MAP[suffix] ?? `${suffix}s`;
  }
  return 'unknown';
}

export function inferActionType(toolName: string): 'create' | 'update' | 'status_change' {
  if (toolName.startsWith('create_')) return 'create';
  if (toolName.startsWith('submit_') || toolName.startsWith('approve_') || toolName.startsWith('reject_') || toolName.startsWith('cancel_') || toolName.startsWith('activate_') || toolName.startsWith('terminate_') || toolName.startsWith('complete_') || toolName.startsWith('void_') || toolName.startsWith('confirm_')) {
    return 'status_change';
  }
  return 'update';
}

const RESOURCE_LABELS: Record<string, { en: string; zh: string }> = {
  purchase_orders: { en: 'Purchase Order', zh: '采购订单' },
  purchase_requisitions: { en: 'Purchase Requisition', zh: '采购申请' },
  sales_orders: { en: 'Sales Order', zh: '销售订单' },
  sales_shipments: { en: 'Sales Shipment', zh: '销售发货' },
  quality_inspections: { en: 'Quality Inspection', zh: '质量检验' },
  work_orders: { en: 'Work Order', zh: '生产工单' },
  vouchers: { en: 'Voucher', zh: '凭证' },
  payment_requests: { en: 'Payment Request', zh: '付款申请' },
  contracts: { en: 'Contract', zh: '合同' },
  stock_levels: { en: 'Stock Transfer', zh: '库存转移' },
};

const ACTION_LABELS: Record<string, { en: string; zh: string }> = {
  create: { en: 'Create', zh: '新建' },
  update: { en: 'Modify', zh: '修改' },
  status_change: { en: 'Status Change', zh: '状态变更' },
};

export function buildDraftSummary(
  toolName: string,
  previewResult: Record<string, unknown>,
  args: Record<string, unknown>,
): DraftSummary {
  const resourceType = inferResourceType(toolName);
  const actionType = inferActionType(toolName);
  const resourceLabel = RESOURCE_LABELS[resourceType]?.zh ?? resourceType;
  const actionLabel = ACTION_LABELS[actionType]?.zh ?? actionType;

  const title = `${actionLabel}${resourceLabel}`;

  const keyFields: Array<{ label: string; value: string }> = [];
  const subtitle_parts: string[] = [];

  if (args.supplier_id || previewResult.supplier_id) {
    subtitle_parts.push(`供应商: ${String(args.supplier_name ?? args.supplier_id ?? previewResult.supplier_id ?? '')}`);
  }
  if (args.customer_id || previewResult.customer_id) {
    subtitle_parts.push(`客户: ${String(args.customer_name ?? args.customer_id ?? previewResult.customer_id ?? '')}`);
  }

  if (args.order_date) keyFields.push({ label: '日期', value: String(args.order_date) });
  if (args.currency) keyFields.push({ label: '币种', value: String(args.currency) });

  const amount = previewResult.totalAmount ?? previewResult.total_amount ?? args.total_amount;
  const itemsCount = previewResult.itemCount ?? previewResult.items_count ?? (Array.isArray(args.items) ? args.items.length : undefined);

  if (typeof amount === 'number') {
    keyFields.push({ label: '金额', value: amount.toLocaleString() });
  }
  if (typeof itemsCount === 'number') {
    keyFields.push({ label: '明细行', value: `${itemsCount} 项` });
  }

  if (actionType === 'status_change') {
    const targetStatus = args.status ?? previewResult.target_status;
    if (targetStatus) keyFields.push({ label: '目标状态', value: String(targetStatus) });
  }

  return {
    title,
    subtitle: subtitle_parts.join(' | ') || resourceLabel,
    amount: typeof amount === 'number' ? amount : undefined,
    currency: args.currency as string | undefined,
    items_count: typeof itemsCount === 'number' ? itemsCount : undefined,
    key_fields: keyFields,
  };
}

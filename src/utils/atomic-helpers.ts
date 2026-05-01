import type { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from './api-error';
import { type AuditContext } from './database';

export interface AtomicCreateConfig {
  /** Header table (e.g. 'purchase_orders') */
  headerTable: string;
  /** Items table (e.g. 'purchase_order_items') */
  itemsTable: string;
  /** FK column in items table pointing to header (e.g. 'purchase_order_id') */
  headerFk: string;
  /** Columns to return from header after insert */
  headerReturnSelect: string;
  /** Columns to return from items after insert */
  itemsReturnSelect: string;
  /** Whether to auto-assign line_number to items (only for tables that have this column) */
  autoLineNumber?: boolean;
}

export interface AtomicCreateInput {
  /** Header fields (excluding items and organization_id) */
  header: Record<string, unknown>;
  /** Array of item records (excluding headerFk) */
  items: Record<string, unknown>[];
}

// ────────────────────────────────────────────────────────────────────────────
// Atomic update: header + items diff in one logical transaction
// ────────────────────────────────────────────────────────────────────────────

export interface AtomicUpdateConfig {
  headerTable: string;
  itemsTable: string;
  headerFk: string;
  /** Whitelist of header fields the PUT may touch */
  headerPermittedFields: string[];
  /** Select expression for returning items after update */
  itemsReturnSelect: string;
  /** Select expression for returning header after update */
  headerReturnSelect: string;
  autoLineNumber?: boolean;
  softDeleteItems?: boolean;
  /** Whether header table uses soft-delete (default true). Set false for hard-delete tables like vouchers. */
  softDeleteHeader?: boolean;
  /** Auto-recalculate a header sum from item fields */
  autoSum?: { headerField: string; itemAmountExpr: (item: Record<string, unknown>) => number; itemSelectFields?: string; sumExpr?: string; };
}

export interface AtomicUpdateInput {
  header: Record<string, unknown>;
  items: {
    upsert: Record<string, unknown>[];
    delete: string[];
  };
}

export async function atomicUpdateWithItems(
  db: SupabaseClient,
  config: AtomicUpdateConfig,
  headerId: string,
  organizationId: string,
  input: AtomicUpdateInput,
  requestId?: string,
): Promise<{ header: Record<string, unknown>; items: Record<string, unknown>[] }> {
  const {
    headerTable, itemsTable, headerFk,
    headerPermittedFields, itemsReturnSelect, headerReturnSelect,
    autoLineNumber = false, softDeleteItems = true, softDeleteHeader = true, autoSum,
  } = config;

  const ITEM_BLOCKED = new Set(['id', 'organization_id', 'deleted_at', 'created_at', 'created_by', headerFk]);

  // Build header update payload (only permitted fields)
  const headerUpdate: Record<string, unknown> = {};
  for (const k of headerPermittedFields) {
    if (input.header[k] !== undefined) headerUpdate[k] = input.header[k];
  }

  // Sanitize upsert items
  const sanitizedUpsert = input.items.upsert.map((item, idx) => {
    const sanitized: Record<string, unknown> = { id: item.id ?? null };
    for (const [k, v] of Object.entries(item)) {
      if (!ITEM_BLOCKED.has(k)) sanitized[k] = v;
    }
    if (autoLineNumber && !sanitized.line_number) {
      sanitized.line_number = idx + 1;
    }
    return sanitized;
  });

  const { data: rpcResult, error: rpcError } = await db.rpc('atomic_update_with_items', {
    p_header_table: headerTable,
    p_items_table: itemsTable,
    p_header_fk: headerFk,
    p_header_id: headerId,
    p_organization_id: organizationId,
    p_header_data: headerUpdate,
    p_items_upsert: sanitizedUpsert,
    p_items_delete: input.items.delete,
    p_header_return_select: headerReturnSelect,
    p_items_return_select: itemsReturnSelect,
    p_auto_line_number: autoLineNumber,
    p_soft_delete_items: softDeleteItems,
    p_soft_delete_header: softDeleteHeader,
    p_auto_sum_field: autoSum?.headerField ?? null,
    p_auto_sum_expr: autoSum?.sumExpr ?? 'COALESCE(amount, quantity * unit_price, 0)',
  });

  if (rpcError) {
    throw ApiError.database(rpcError.message, requestId, `Failed to update ${headerTable} with items atomically.`);
  }

  const result = rpcResult as { header: Record<string, unknown>; items: Record<string, unknown>[] };
  return { header: result.header, items: result.items ?? [] };
}

export async function atomicCreateWithItems(
  db: SupabaseClient,
  config: AtomicCreateConfig,
  input: AtomicCreateInput,
  audit?: AuditContext
): Promise<{ header: Record<string, unknown>; items: Record<string, unknown>[] }> {
  const { headerTable, itemsTable, headerFk, headerReturnSelect, itemsReturnSelect } = config;
  const { header, items } = input;

  const HEADER_BLOCKED = new Set(['id', 'deleted_at', 'created_at', 'approved_by', 'approved_at', 'posted_at']);
  const sanitizedHeader = Object.fromEntries(
    Object.entries(header).filter(([k]) => !HEADER_BLOCKED.has(k))
  );

  // Use Postgres RPC for true transactional atomicity
  const { data: rpcResult, error: rpcError } = await db.rpc('atomic_create_with_items', {
    p_header_table: headerTable,
    p_items_table: itemsTable,
    p_header_fk: headerFk,
    p_header_data: sanitizedHeader,
    p_items_data: items,
    p_header_return_select: headerReturnSelect,
    p_items_return_select: itemsReturnSelect,
    p_auto_line_number: config.autoLineNumber ?? false,
  });

  if (rpcError) {
    throw ApiError.database(rpcError.message, audit?.requestId, `Failed to create ${headerTable} with items atomically.`);
  }

  const result = rpcResult as { header: Record<string, unknown>; items: Record<string, unknown>[] };

  if (audit) {
    await db.from('business_events').insert({
      organization_id: audit.organizationId,
      event_type: audit.action,
      entity_type: audit.resource,
      entity_id: String(result.header.id ?? ''),
      payload: { actor_id: audit.userId, request_id: audit.requestId },
      severity: 'info',
    });
  }

  return { header: result.header, items: result.items ?? [] };
}

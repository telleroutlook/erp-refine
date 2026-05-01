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
  autoSum?: { headerField: string; itemAmountExpr: (item: Record<string, unknown>) => number; itemSelectFields?: string; };
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

  for (const itemId of input.items.delete) {
    if (softDeleteItems) {
      const { error } = await db
        .from(itemsTable)
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', itemId)
        .eq(headerFk, headerId);
      if (error) throw ApiError.database(error.message, requestId, `Failed to delete ${itemsTable} item ${itemId}`);
    } else {
      const { error } = await db.from(itemsTable).delete().eq('id', itemId).eq(headerFk, headerId);
      if (error) throw ApiError.database(error.message, requestId, `Failed to delete ${itemsTable} item ${itemId}`);
    }
  }

  let lineSeq = 0;
  for (const item of input.items.upsert) {
    lineSeq++;
    const sanitized = Object.fromEntries(
      Object.entries(item).filter(([k]) => !ITEM_BLOCKED.has(k))
    );
    if (autoLineNumber && !sanitized.line_number) {
      sanitized.line_number = lineSeq;
    }

    if (item.id) {
      let q = db
        .from(itemsTable)
        .update(sanitized)
        .eq('id', item.id)
        .eq(headerFk, headerId);
      if (softDeleteItems) q = q.is('deleted_at', null);
      const { error } = await q;
      if (error) throw ApiError.database(error.message, requestId, `Failed to update ${itemsTable} item ${item.id}`);
    } else {
      sanitized[headerFk] = headerId;
      const { error } = await db.from(itemsTable).insert(sanitized);
      if (error) throw ApiError.database(error.message, requestId, `Failed to insert new ${itemsTable} item`);
    }
  }

  const headerUpdate: Record<string, unknown> = {};
  for (const k of headerPermittedFields) {
    if (input.header[k] !== undefined) headerUpdate[k] = input.header[k];
  }

  if (autoSum) {
    const selectFields = autoSum.itemSelectFields ?? 'quantity, unit_price, amount, planned_amount, line_amount, total_price, qty_offered';
    let q = db.from(itemsTable).select(selectFields).eq(headerFk, headerId);
    if (softDeleteItems) q = q.is('deleted_at', null);
    const { data: allItems, error: sumErr } = await q;
    if (sumErr) throw ApiError.database(sumErr.message, requestId, 'Failed to recalculate totals');
    const total = ((allItems ?? []) as unknown as Record<string, unknown>[]).reduce(
      (sum: number, it: Record<string, unknown>) => sum + autoSum.itemAmountExpr(it),
      0,
    );
    headerUpdate[autoSum.headerField] = Number(total.toFixed(2));
  }

  if (Object.keys(headerUpdate).length > 0) {
    let q = db
      .from(headerTable)
      .update(headerUpdate)
      .eq('id', headerId)
      .eq('organization_id', organizationId);
    if (softDeleteHeader) q = q.is('deleted_at', null);
    const { error } = await q;
    if (error) throw ApiError.database(error.message, requestId, `Failed to update ${headerTable}`);
  }

  const { data: header, error: hErr } = await db
    .from(headerTable)
    .select(headerReturnSelect)
    .eq('id', headerId)
    .eq('organization_id', organizationId)
    .single();
  if (hErr) throw ApiError.database(hErr.message, requestId);

  let itemsQuery = db.from(itemsTable).select(itemsReturnSelect).eq(headerFk, headerId);
  if (softDeleteItems) itemsQuery = itemsQuery.is('deleted_at', null);
  const { data: items, error: iErr } = await itemsQuery;
  if (iErr) throw ApiError.database(iErr.message, requestId);

  return { header: header as unknown as Record<string, unknown>, items: (items ?? []) as unknown as Record<string, unknown>[] };
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
    db.from('business_events').insert({
      organization_id: audit.organizationId,
      event_type: audit.action,
      entity_type: audit.resource,
      entity_id: String(result.header.id ?? ''),
      payload: { actor_id: audit.userId, request_id: audit.requestId },
      severity: 'info',
    }).then(() => {});
  }

  return { header: result.header, items: result.items ?? [] };
}

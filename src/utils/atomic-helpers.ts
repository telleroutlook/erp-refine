// src/utils/atomic-helpers.ts
// Atomic create-with-items: insert header + lines, rollback on failure via CASCADE delete

import type { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from './api-error';
import { executeWithAudit, type AuditContext } from './database';

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
  /** Whether to auto-assign line_no to items (only for tables that have this column) */
  autoLineNo?: boolean;
}

export interface AtomicCreateInput {
  /** Header fields (excluding items and organization_id) */
  header: Record<string, unknown>;
  /** Array of item records (excluding headerFk) */
  items: Record<string, unknown>[];
}

/**
 * Atomically insert a header + items.
 * If items insertion fails, the header is deleted (CASCADE cleans up any partial items).
 */
export async function atomicCreateWithItems(
  db: SupabaseClient,
  config: AtomicCreateConfig,
  input: AtomicCreateInput,
  audit?: AuditContext
): Promise<{ header: Record<string, unknown>; items: Record<string, unknown>[] }> {
  const { headerTable, itemsTable, headerFk, headerReturnSelect, itemsReturnSelect } = config;
  const { header, items } = input;

  // Step 1: Insert header
  const insertHeader = async () => {
    const result = await db.from(headerTable).insert(header).select(headerReturnSelect).single();
    return result as { data: Record<string, unknown> | null; error: { message: string } | null };
  };

  let headerData: Record<string, unknown>;
  if (audit) {
    headerData = await executeWithAudit(db, insertHeader, audit);
  } else {
    const { data, error } = await insertHeader();
    if (error) {
      throw ApiError.database(error.message, undefined, `Failed to create ${headerTable} header.`);
    }
    if (!data) {
      throw ApiError.database(`No data returned when creating ${headerTable} header.`, undefined);
    }
    headerData = data;
  }

  const headerId = headerData.id;

  // Step 2: Insert items with header FK
  if (items.length > 0) {
    const itemsWithFk = items.map((item, idx) => {
      const row: Record<string, unknown> = {
        ...item,
        [headerFk]: headerId,
      };
      if (config.autoLineNo) {
        row.line_no = item.line_no ?? idx + 1;
      }
      return row;
    });

    const { data: itemsData, error: itemsError } = await db
      .from(itemsTable)
      .insert(itemsWithFk)
      .select(itemsReturnSelect);

    if (itemsError) {
      // Rollback: delete header (CASCADE removes any partial items)
      await db.from(headerTable).delete().eq('id', headerId);
      throw ApiError.database(
        itemsError.message,
        audit?.requestId,
        `Failed to create ${itemsTable}. The ${headerTable} was rolled back. Check item data validity.`
      );
    }

    return { header: headerData, items: (itemsData as unknown as Record<string, unknown>[]) ?? [] };
  }

  return { header: headerData, items: [] };
}

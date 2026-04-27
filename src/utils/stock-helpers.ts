// src/utils/stock-helpers.ts
// Stock adjustment helpers — concurrent-safe via Supabase RPC

import type { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from './api-error';

export interface StockAdjustment {
  organizationId: string;
  warehouseId: string;
  productId: string;
  qtyDelta: number;
  reservedDelta?: number;
}

export interface StockTransactionInput {
  organizationId: string;
  warehouseId: string;
  productId: string;
  transactionType: 'in' | 'out' | 'transfer' | 'adjust';
  qty: number;
  referenceType?: string;
  referenceId?: string;
  lotNumber?: string;
  serialNumber?: string;
  storageLocationId?: string;
  costPrice?: number;
  notes?: string;
  createdBy: string;
}

/**
 * Adjust stock levels by inserting a stock_transaction record.
 * The tr_stock_transaction_update trigger on stock_transactions automatically
 * keeps stock_records.quantity in sync — no direct stock_records write needed.
 */
export async function adjustStock(
  db: SupabaseClient,
  adj: StockAdjustment,
  requestId?: string
): Promise<void> {
  await createStockTransaction(db, {
    organizationId: adj.organizationId,
    warehouseId: adj.warehouseId,
    productId: adj.productId,
    transactionType: adj.qtyDelta >= 0 ? 'in' : 'out',
    qty: Math.abs(adj.qtyDelta),
    createdBy: 'system',
  }, requestId);
}

/** Map a StockTransactionInput to the DB row shape. */
function toDbRow(tx: StockTransactionInput): Record<string, unknown> {
  return {
    organization_id: tx.organizationId,
    warehouse_id: tx.warehouseId,
    product_id: tx.productId,
    transaction_type: tx.transactionType,
    quantity: tx.qty,
    reference_type: tx.referenceType,
    reference_id: tx.referenceId,
    notes: tx.notes,
    created_by: tx.createdBy,
  };
}

/** Create an immutable stock transaction record.
 * The tr_stock_transaction_update trigger automatically updates stock_records.quantity.
 */
export async function createStockTransaction(
  db: SupabaseClient,
  tx: StockTransactionInput,
  requestId?: string
): Promise<void> {
  const { error } = await db.from('stock_transactions').insert(toDbRow(tx));

  if (error) {
    throw ApiError.database(
      `Failed to record stock transaction: ${error.message}`,
      requestId,
      'This is an audit record. The stock adjustment may have succeeded but the audit trail is incomplete.'
    );
  }
}

/**
 * Insert multiple stock transaction records in a single DB round-trip.
 * The tr_stock_transaction_update trigger fires per-row and keeps stock_records in sync.
 */
export async function batchCreateStockTransactions(
  db: SupabaseClient,
  txs: StockTransactionInput[],
  requestId?: string
): Promise<void> {
  if (txs.length === 0) return;

  const { error } = await db.from('stock_transactions').insert(txs.map(toDbRow));

  if (error) {
    throw ApiError.database(
      `Failed to record batch stock transactions: ${error.message}`,
      requestId,
      'This is an audit record. The stock adjustments may have succeeded but the audit trail is incomplete.'
    );
  }
}

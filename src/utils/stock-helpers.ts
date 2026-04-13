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
  transactionType: 'in' | 'out' | 'transfer' | 'adjust' | 'scrap';
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
 * Adjust stock levels via the adjust_stock RPC function (concurrent-safe).
 * Falls back to manual UPSERT if RPC is not available.
 */
export async function adjustStock(
  db: SupabaseClient,
  adj: StockAdjustment,
  requestId?: string
): Promise<void> {
  // Try RPC first (uses row-level locking for concurrent safety)
  const { error: rpcError } = await db.rpc('adjust_stock', {
    p_org_id: adj.organizationId,
    p_warehouse_id: adj.warehouseId,
    p_product_id: adj.productId,
    p_qty_delta: adj.qtyDelta,
    p_reserved_delta: adj.reservedDelta ?? 0,
  });

  if (rpcError) {
    // Check if it's a "function not found" error — fall back to manual upsert
    if (rpcError.message.includes('Could not find') || (rpcError.message.includes('function') && rpcError.message.includes('does not exist'))) {
      await adjustStockFallback(db, adj, requestId);
      return;
    }
    throw ApiError.database(
      `Stock adjustment failed: ${rpcError.message}`,
      requestId,
      'Verify the product and warehouse exist in this organization.'
    );
  }
}

/** Fallback: manual UPSERT for stock adjustment (less concurrent-safe) */
async function adjustStockFallback(
  db: SupabaseClient,
  adj: StockAdjustment,
  requestId?: string
): Promise<void> {
  // Check if record exists
  const { data: existing } = await db
    .from('stock_records')
    .select('id, qty_on_hand, qty_reserved')
    .eq('organization_id', adj.organizationId)
    .eq('warehouse_id', adj.warehouseId)
    .eq('product_id', adj.productId)
    .single();

  if (existing) {
    const newQty = existing.qty_on_hand + adj.qtyDelta;
    const newReserved = existing.qty_reserved + (adj.reservedDelta ?? 0);
    if (newQty < 0) {
      throw ApiError.insufficientStock(adj.productId, adj.warehouseId, Math.abs(adj.qtyDelta), existing.qty_on_hand, requestId);
    }
    const { error } = await db
      .from('stock_records')
      .update({
        qty_on_hand: newQty,
        qty_reserved: newReserved,
      })
      .eq('id', existing.id);
    if (error) throw ApiError.database(error.message, requestId);
  } else {
    if (adj.qtyDelta < 0) {
      throw ApiError.insufficientStock(adj.productId, adj.warehouseId, Math.abs(adj.qtyDelta), 0, requestId);
    }
    const { error } = await db.from('stock_records').insert({
      organization_id: adj.organizationId,
      warehouse_id: adj.warehouseId,
      product_id: adj.productId,
      qty_on_hand: adj.qtyDelta,
      qty_reserved: adj.reservedDelta ?? 0,
    });
    if (error) throw ApiError.database(error.message, requestId);
  }
}

/** Create an immutable stock transaction record */
export async function createStockTransaction(
  db: SupabaseClient,
  tx: StockTransactionInput,
  requestId?: string
): Promise<void> {
  const { error } = await db.from('stock_transactions').insert({
    organization_id: tx.organizationId,
    warehouse_id: tx.warehouseId,
    product_id: tx.productId,
    transaction_type: tx.transactionType,
    qty: tx.qty,
    reference_type: tx.referenceType,
    reference_id: tx.referenceId,
    notes: tx.notes,
    created_by: tx.createdBy,
  });

  if (error) {
    throw ApiError.database(
      `Failed to record stock transaction: ${error.message}`,
      requestId,
      'This is an audit record. The stock adjustment may have succeeded but the audit trail is incomplete.'
    );
  }
}

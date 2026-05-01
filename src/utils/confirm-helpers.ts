// src/utils/confirm-helpers.ts
// Shared confirm logic for shipments and receipts — used by both AI tools and REST routes

import type { SupabaseClient } from '@supabase/supabase-js';
import { atomicStatusTransition } from './database';
import { batchCreateStockTransactions } from './stock-helpers';
import { ApiError } from './api-error';
import { ErrorCode } from '../types/errors';

export interface ConfirmShipmentParams {
  db: SupabaseClient;
  id: string;
  organizationId: string;
  userId: string;
  requestId?: string;
}

export interface ConfirmShipmentResult {
  id: string;
  shipmentNumber: string;
  status: 'confirmed';
}

export async function confirmSalesShipment(params: ConfirmShipmentParams): Promise<ConfirmShipmentResult> {
  const { db, id, organizationId, userId, requestId } = params;

  const { data: shipment, error } = await db
    .from('sales_shipments')
    .select('id, shipment_number, status, warehouse_id, sales_order_id, items:sales_shipment_items(id, product_id, quantity, sales_order_item_id)')
    .eq('id', id)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .single();

  if (error || !shipment) throw new ApiError({ code: ErrorCode.NOT_FOUND, detail: 'Sales shipment not found', requestId: requestId ?? '' });
  if (shipment.status !== 'draft') throw new ApiError({ code: ErrorCode.INVALID_STATE, detail: `Cannot confirm shipment in status '${shipment.status}'`, requestId: requestId ?? '' });
  if (!shipment.warehouse_id) throw new ApiError({ code: ErrorCode.VALIDATION_ERROR, detail: 'Warehouse is required to confirm a shipment', requestId: requestId ?? '' });

  const { data: transitioned } = await atomicStatusTransition(
    db, 'sales_shipments', id, organizationId, 'draft',
    { status: 'confirmed', confirmed_by: userId, confirmed_at: new Date().toISOString() },
    'id, shipment_number',
  );
  if (!transitioned) throw new Error('Shipment status changed concurrently; please retry');

  const items = (shipment as any).items ?? [];
  if (items.length > 0) {
    try {
      await batchCreateStockTransactions(db, items.map((item: any) => ({
        organizationId,
        warehouseId: shipment.warehouse_id!,
        productId: item.product_id,
        transactionType: 'out' as const,
        qty: Number(item.quantity),
        referenceType: 'sales_shipment',
        referenceId: shipment.id,
        createdBy: userId,
      })), requestId);

      await Promise.all(
        items
          .filter((item: any) => item.sales_order_item_id)
          .map((item: any) =>
            db.rpc('increment_so_shipped_qty', {
              p_soi_id: item.sales_order_item_id,
              p_qty: Number(item.quantity),
            })
          )
      );
    } catch (stockErr) {
      await db.from('sales_shipments')
        .update({ status: 'draft', confirmed_by: null, confirmed_at: null })
        .eq('id', id)
        .eq('organization_id', organizationId);
      throw stockErr;
    }
  }

  if (shipment.sales_order_id) {
    await db.rpc('update_so_status_from_items', {
      p_so_id: shipment.sales_order_id,
      p_org_id: organizationId,
    });
  }

  return { id: shipment.id, shipmentNumber: shipment.shipment_number, status: 'confirmed' };
}

export interface ConfirmReceiptParams {
  db: SupabaseClient;
  id: string;
  organizationId: string;
  userId: string;
  requestId?: string;
}

export interface ConfirmReceiptResult {
  id: string;
  receiptNumber: string;
  status: 'confirmed';
  stockTransactionsCreated: number;
}

export async function confirmPurchaseReceipt(params: ConfirmReceiptParams): Promise<ConfirmReceiptResult> {
  const { db, id, organizationId, userId, requestId } = params;

  const { data: receipt, error } = await db
    .from('purchase_receipts')
    .select('id, receipt_number, status, warehouse_id, purchase_order_id, items:purchase_receipt_items(id, product_id, quantity, lot_number, purchase_order_item_id)')
    .eq('id', id)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .single();

  if (error || !receipt) throw new ApiError({ code: ErrorCode.NOT_FOUND, detail: 'Purchase receipt not found', requestId: requestId ?? '' });
  if (receipt.status !== 'draft') throw new ApiError({ code: ErrorCode.INVALID_STATE, detail: `Cannot confirm receipt in status '${receipt.status}'`, requestId: requestId ?? '' });
  if (!receipt.warehouse_id) throw new ApiError({ code: ErrorCode.VALIDATION_ERROR, detail: 'Warehouse is required to confirm a receipt', requestId: requestId ?? '' });

  const { data: transitioned } = await atomicStatusTransition(
    db, 'purchase_receipts', id, organizationId, 'draft',
    { status: 'confirmed', confirmed_by: userId, confirmed_at: new Date().toISOString() },
    'id, receipt_number',
  );
  if (!transitioned) throw new Error('Purchase receipt status changed concurrently; please retry');

  const items = (receipt as any).items ?? [];
  if (items.length > 0) {
    try {
      await batchCreateStockTransactions(db, items.map((item: any) => ({
        organizationId,
        warehouseId: receipt.warehouse_id!,
        productId: item.product_id,
        transactionType: 'in' as const,
        qty: Number(item.quantity),
        referenceType: 'purchase_receipt',
        referenceId: receipt.id,
        lotNumber: item.lot_number ?? undefined,
        createdBy: userId,
      })), requestId);

      await Promise.all(
        items
          .filter((item: any) => item.purchase_order_item_id)
          .map((item: any) =>
            db.rpc('increment_po_received_qty', {
              p_poi_id: item.purchase_order_item_id,
              p_qty: Number(item.quantity),
            })
          )
      );
    } catch (stockErr) {
      await db.from('purchase_receipts')
        .update({ status: 'draft', confirmed_by: null, confirmed_at: null })
        .eq('id', id)
        .eq('organization_id', organizationId);
      throw stockErr;
    }
  }

  if (receipt.purchase_order_id) {
    await db.rpc('update_po_status_from_items', {
      p_po_id: receipt.purchase_order_id,
      p_org_id: organizationId,
    });
  }

  return { id: receipt.id, receiptNumber: receipt.receipt_number, status: 'confirmed', stockTransactionsCreated: items.length };
}

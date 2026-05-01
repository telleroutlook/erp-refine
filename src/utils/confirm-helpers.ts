// src/utils/confirm-helpers.ts
// Shared confirm logic for shipments, receipts, and returns — delegates to atomic Postgres RPCs

import type { SupabaseClient } from '@supabase/supabase-js';
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

  const { data, error } = await db.rpc('confirm_sales_shipment', {
    p_shipment_id: id,
    p_org_id: organizationId,
    p_user_id: userId,
  });

  if (error) throw new ApiError({ code: ErrorCode.DATABASE_ERROR, detail: error.message, requestId: requestId ?? '' });

  const result = data as { success: boolean; error?: string; current_status?: string; id?: string; shipment_number?: string };
  if (!result.success) {
    if (result.error === 'shipment_not_found') throw new ApiError({ code: ErrorCode.NOT_FOUND, detail: 'Sales shipment not found', requestId: requestId ?? '' });
    if (result.error === 'invalid_status') throw new ApiError({ code: ErrorCode.INVALID_STATE, detail: `Cannot confirm shipment in status '${result.current_status}'`, requestId: requestId ?? '' });
    if (result.error === 'warehouse_required') throw new ApiError({ code: ErrorCode.VALIDATION_ERROR, detail: 'Warehouse is required to confirm a shipment', requestId: requestId ?? '' });
    throw new ApiError({ code: ErrorCode.DATABASE_ERROR, detail: result.error ?? 'Unknown error', requestId: requestId ?? '' });
  }

  return { id: result.id!, shipmentNumber: result.shipment_number!, status: 'confirmed' };
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

  const { data, error } = await db.rpc('confirm_purchase_receipt', {
    p_receipt_id: id,
    p_org_id: organizationId,
    p_user_id: userId,
  });

  if (error) throw new ApiError({ code: ErrorCode.DATABASE_ERROR, detail: error.message, requestId: requestId ?? '' });

  const result = data as { success: boolean; error?: string; current_status?: string; id?: string; receipt_number?: string; stock_transactions_created?: number };
  if (!result.success) {
    if (result.error === 'receipt_not_found') throw new ApiError({ code: ErrorCode.NOT_FOUND, detail: 'Purchase receipt not found', requestId: requestId ?? '' });
    if (result.error === 'invalid_status') throw new ApiError({ code: ErrorCode.INVALID_STATE, detail: `Cannot confirm receipt in status '${result.current_status}'`, requestId: requestId ?? '' });
    if (result.error === 'warehouse_required') throw new ApiError({ code: ErrorCode.VALIDATION_ERROR, detail: 'Warehouse is required to confirm a receipt', requestId: requestId ?? '' });
    throw new ApiError({ code: ErrorCode.DATABASE_ERROR, detail: result.error ?? 'Unknown error', requestId: requestId ?? '' });
  }

  return { id: result.id!, receiptNumber: result.receipt_number!, status: 'confirmed', stockTransactionsCreated: result.stock_transactions_created ?? 0 };
}

export interface ConfirmSalesReturnParams {
  db: SupabaseClient;
  id: string;
  organizationId: string;
  userId: string;
  requestId?: string;
}

export interface ConfirmSalesReturnResult {
  id: string;
  returnNumber: string;
  status: 'received';
  stockTransactionsCreated: number;
}

export async function confirmSalesReturn(params: ConfirmSalesReturnParams): Promise<ConfirmSalesReturnResult> {
  const { db, id, organizationId, userId, requestId } = params;

  const { data, error } = await db.rpc('receive_sales_return', {
    p_return_id: id,
    p_org_id: organizationId,
    p_user_id: userId,
  });

  if (error) throw new ApiError({ code: ErrorCode.DATABASE_ERROR, detail: error.message, requestId: requestId ?? '' });

  const result = data as { success: boolean; error?: string; current_status?: string; id?: string; return_number?: string; stock_transactions_created?: number };
  if (!result.success) {
    if (result.error === 'return_not_found') throw new ApiError({ code: ErrorCode.NOT_FOUND, detail: 'Sales return not found', requestId: requestId ?? '' });
    if (result.error === 'invalid_status') throw new ApiError({ code: ErrorCode.INVALID_STATE, detail: `Cannot receive return in status '${result.current_status}'`, requestId: requestId ?? '' });
    if (result.error === 'warehouse_required') throw new ApiError({ code: ErrorCode.VALIDATION_ERROR, detail: 'Warehouse is required to receive a return', requestId: requestId ?? '' });
    throw new ApiError({ code: ErrorCode.DATABASE_ERROR, detail: result.error ?? 'Unknown error', requestId: requestId ?? '' });
  }

  return { id: result.id!, returnNumber: result.return_number!, status: 'received', stockTransactionsCreated: result.stock_transactions_created ?? 0 };
}

// src/utils/create-from-helpers.ts
// Reusable utilities for document flow "create from" (参考创建) feature.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { DocumentFlowConfig } from './document-flow';
import { ApiError } from './api-error';

export interface SourceItemWithOpenQty {
  item: Record<string, unknown>;
  openQuantity: number;
}

export interface CreateFromPreview {
  header: Record<string, unknown>;
  items: Array<Record<string, unknown> & { _open_quantity: number; _source_item_id: string }>;
  source: { id: string; type: string; number: string };
}

/**
 * Fetch the source document and compute open quantities for each line item.
 * Filters out items that are fully fulfilled (openQty <= 0).
 */
export async function fetchSourceWithOpenQuantities(
  db: SupabaseClient<any, any, any>,
  flow: DocumentFlowConfig,
  sourceId: string,
  orgId: string,
  requestId?: string
): Promise<{ source: Record<string, unknown>; items: SourceItemWithOpenQty[] }> {
  const { data, error } = await db
    .from(flow.sourceTable)
    .select(flow.sourceDetailSelect)
    .eq('id', sourceId)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .single();

  if (error || !data) {
    throw ApiError.notFound(flow.sourceType, sourceId, requestId);
  }

  const source = data as unknown as Record<string, unknown>;

  if (!flow.sourceValidStatuses.includes(source.status as string)) {
    throw ApiError.invalidState(
      flow.sourceType,
      source.status as string,
      'create-from',
      requestId,
      `Source document must be in status: ${flow.sourceValidStatuses.join(', ')}`
    );
  }

  const rawItems = ((source.items ?? []) as Record<string, unknown>[]).filter(
    (i) => !(i as any).deleted_at
  );

  if (flow.fulfilledFields && flow.fulfilledFields.length > 0) {
    const items = rawItems
      .map((item) => {
        const totalQty = Number(item[flow.quantityField] ?? 0);
        const fulfilledQty = flow.fulfilledFields!.reduce(
          (sum, f) => sum + Number(item[f] ?? 0),
          0
        );
        return { item, openQuantity: totalQty - fulfilledQty };
      })
      .filter((x) => x.openQuantity > 0);

    return { source, items };
  }

  if (flow.targetItemSourceItemFk) {
    const itemIds = rawItems.map((i) => i.id as string).filter(Boolean);
    if (itemIds.length === 0) return { source, items: [] };

    const { data: targetData } = await db
      .from(flow.targetItemsTable)
      .select(`${flow.targetItemSourceItemFk}, quantity`)
      .in(flow.targetItemSourceItemFk, itemIds)
      .eq('organization_id', orgId)
      .is('deleted_at', null);

    const existing = (targetData ?? []) as unknown as Record<string, unknown>[];
    const fulfilledMap = new Map<string, number>();
    for (const ti of existing) {
      const key = ti[flow.targetItemSourceItemFk] as string;
      fulfilledMap.set(key, (fulfilledMap.get(key) ?? 0) + Number(ti.quantity ?? 0));
    }

    const items = rawItems
      .map((item) => {
        const totalQty = Number(item[flow.quantityField] ?? 0);
        const fulfilledQty = fulfilledMap.get(item.id as string) ?? 0;
        return { item, openQuantity: totalQty - fulfilledQty };
      })
      .filter((x) => x.openQuantity > 0);

    return { source, items };
  }

  const items = rawItems.map((item) => ({
    item,
    openQuantity: Number(item[flow.quantityField] ?? 0),
  })).filter((x) => x.openQuantity > 0);

  return { source, items };
}

/**
 * Build pre-filled header + items for the target document create form.
 */
export function buildPrefilledData(
  flow: DocumentFlowConfig,
  source: Record<string, unknown>,
  itemsWithOpenQty: SourceItemWithOpenQty[]
): CreateFromPreview {
  const header = flow.headerMapping(source);

  const items = itemsWithOpenQty.map(({ item, openQuantity }) => ({
    ...flow.itemMapping(item, openQuantity),
    _open_quantity: openQuantity,
    _source_item_id: item.id as string,
    _product: item.product ?? null,
  }));

  if (flow.sourceType === 'purchase_requisition') {
    const firstSupplier = itemsWithOpenQty.find(
      ({ item }) => item.suggested_supplier_id
    );
    if (firstSupplier) {
      header.supplier_id = firstSupplier.item.suggested_supplier_id;
    }
  }

  return {
    header,
    items: items as CreateFromPreview['items'],
    source: {
      id: source.id as string,
      type: flow.sourceType,
      number: source[flow.sourceNumberField] as string,
    },
  };
}

/**
 * Validate that items to be created do not exceed source open quantities.
 * Call this BEFORE atomicCreateWithItems when _sourceRef is provided.
 */
export async function validateItemsAgainstSource(
  db: SupabaseClient<any, any, any>,
  flow: DocumentFlowConfig,
  sourceId: string,
  items: Record<string, unknown>[],
  orgId: string,
  requestId?: string
): Promise<void> {
  const { items: openItems } = await fetchSourceWithOpenQuantities(db, flow, sourceId, orgId, requestId);

  const openMap = new Map<string, { openQuantity: number; productId: string }>();
  for (const { item, openQuantity } of openItems) {
    openMap.set(item.id as string, { openQuantity, productId: (item.product_id as string) ?? '' });
  }

  const sourceItemFk = flow.targetItemSourceItemFk;
  if (!sourceItemFk) return;

  for (const newItem of items) {
    const sourceItemId = newItem[sourceItemFk] as string | undefined;
    if (!sourceItemId) continue;

    const open = openMap.get(sourceItemId);
    const qty = Number(newItem.quantity ?? 0);

    if (!open) {
      throw ApiError.badRequest(
        `Item references source item ${sourceItemId} which has no open quantity (already fully fulfilled)`,
        requestId
      );
    }
    if (qty > open.openQuantity) {
      throw ApiError.badRequest(
        `Item quantity ${qty} exceeds open quantity ${open.openQuantity} for source item ${sourceItemId}`,
        requestId
      );
    }
  }
}

/**
 * Validate that a payment amount does not exceed invoice outstanding balance.
 */
export async function validateReceiptAmount(
  db: SupabaseClient<any, any, any>,
  referenceType: string,
  referenceId: string,
  amount: number,
  orgId: string,
  requestId?: string
): Promise<void> {
  if (referenceType !== 'sales_invoice') return;

  const [receiptsResult, invoiceResult] = await Promise.all([
    db
      .from('customer_receipts')
      .select('amount')
      .eq('reference_type', 'sales_invoice')
      .eq('reference_id', referenceId)
      .eq('organization_id', orgId)
      .neq('status', 'cancelled')
      .is('deleted_at', null),
    db
      .from('sales_invoices')
      .select('id, total_amount, tax_amount')
      .eq('id', referenceId)
      .eq('organization_id', orgId)
      .single(),
  ]);

  const existingTotal = (receiptsResult.data ?? []).reduce((sum: number, r: any) => sum + Number(r.amount ?? 0), 0);
  const invoiceTotal = Number(invoiceResult.data?.total_amount ?? 0) + Number(invoiceResult.data?.tax_amount ?? 0);
  const outstanding = invoiceTotal - existingTotal;

  if (amount > outstanding) {
    throw ApiError.badRequest(
      `Receipt amount ${amount} exceeds outstanding balance ${outstanding} (invoice total: ${invoiceTotal}, already received: ${existingTotal})`,
      requestId
    );
  }
}

/**
 * Insert a document_relations record linking source → target.
 */
export async function createDocumentRelation(
  db: SupabaseClient<any, any, any>,
  orgId: string,
  fromType: string,
  fromId: string,
  toType: string,
  toId: string,
  label: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const { error } = await db.from('document_relations').insert({
    organization_id: orgId,
    from_object_type: fromType,
    from_object_id: fromId,
    to_object_type: toType,
    to_object_id: toId,
    relation_type: 'derived_from',
    label,
    metadata: metadata ?? {},
  });
  if (error) {
    console.error('[document-relation] Failed to create:', error.message);
  }
}

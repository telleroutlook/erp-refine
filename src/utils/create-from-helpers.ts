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
      .in(flow.targetItemSourceItemFk, itemIds);

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

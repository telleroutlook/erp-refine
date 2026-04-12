// scripts/seed/phases/phase3-documents.ts
// Phase 3: Create POs and SOs via atomic API endpoints

import type { SeedApiClient } from '../api-client';
import type { SeedProgress } from '../progress';
import type { GeneratedDocument } from '../types';

export async function runPhase3(
  client: SeedApiClient,
  progress: SeedProgress,
  purchaseOrders: Array<Record<string, unknown>>,
  salesOrders: Array<Record<string, unknown>>,
  orgName: string
): Promise<{ createdPOs: GeneratedDocument[]; createdSOs: GeneratedDocument[] }> {
  const total = purchaseOrders.length + salesOrders.length;
  progress.startPhase(`Phase 3: Create Documents [${orgName}]`, total);

  // --- Create Purchase Orders ---
  const createdPOs: GeneratedDocument[] = [];
  for (let i = 0; i < purchaseOrders.length; i++) {
    const { _month, _supplierCode, ...poBody } = purchaseOrders[i] as any;
    const resp = await client.safePost('/api/purchase-orders', poBody, {
      phase: 'phase3', entity: 'purchase-order', index: i,
    });

    if (resp?.data) {
      createdPOs.push({
        id: resp.data.id,
        orderNumber: resp.data.order_number,
        date: poBody.order_date,
        status: 'draft',
        itemCount: poBody.items?.length ?? 0,
        refs: { supplier_id: poBody.supplier_id, warehouse_id: poBody.warehouse_id, _month, _supplierCode },
      });
      progress.tick(true);
    } else {
      progress.tick(false);
    }
  }

  // --- Create Sales Orders ---
  const createdSOs: GeneratedDocument[] = [];
  for (let i = 0; i < salesOrders.length; i++) {
    const { _month, _customerCode, ...soBody } = salesOrders[i] as any;
    const resp = await client.safePost('/api/sales-orders', soBody, {
      phase: 'phase3', entity: 'sales-order', index: i,
    });

    if (resp?.data) {
      createdSOs.push({
        id: resp.data.id,
        orderNumber: resp.data.order_number,
        date: soBody.order_date,
        status: 'draft',
        itemCount: soBody.items?.length ?? 0,
        refs: { customer_id: soBody.customer_id, warehouse_id: soBody.warehouse_id, _month, _customerCode },
      });
      progress.tick(true);
    } else {
      progress.tick(false);
    }
  }

  progress.endPhase();
  return { createdPOs, createdSOs };
}

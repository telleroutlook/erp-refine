// scripts/seed/phases/phase4-workflows.ts
// Phase 4: Status transitions + workflow actions
// - Approve POs → Create purchase receipts → Confirm receipts (stock IN)
// - Approve SOs → Create shipments → Update to packed → Confirm shipments (stock OUT)
// - Create a few sales returns

import type { SeedApiClient } from '../api-client';
import type { SeedProgress } from '../progress';
import type { GeneratedDocument } from '../types';
import type { IdRegistry } from '../id-registry';
import { pick, randomDate, randomInt } from '../data/shared';

export async function runPhase4(
  client: SeedApiClient,
  progress: SeedProgress,
  registry: IdRegistry,
  purchaseOrders: GeneratedDocument[],
  salesOrders: GeneratedDocument[],
  orgName: string
): Promise<{
  confirmedReceipts: GeneratedDocument[];
  confirmedShipments: GeneratedDocument[];
}> {
  // Decide which POs/SOs get which status
  const posToApprove = purchaseOrders.slice(0, Math.floor(purchaseOrders.length * 0.85));
  const posToReceive = posToApprove.slice(0, Math.floor(posToApprove.length * 0.65));

  const sosToApprove = salesOrders.slice(0, Math.floor(salesOrders.length * 0.85));
  const sosToShip = sosToApprove.slice(0, Math.floor(sosToApprove.length * 0.7));

  const totalOps = posToApprove.length + posToReceive.length * 2
    + sosToApprove.length + sosToShip.length * 3;
  progress.startPhase(`Phase 4: Workflows [${orgName}]`, totalOps);

  // --- 4a: Approve Purchase Orders ---
  for (const po of posToApprove) {
    const resp = await client.safePut(`/api/purchase-orders/${po.id}`, { status: 'approved' }, {
      phase: 'phase4', entity: 'po-approve', index: 0,
    });
    progress.tick(!!resp);
    if (resp) po.status = 'approved';
  }

  // --- 4b: Create Purchase Receipts and Confirm ---
  const confirmedReceipts: GeneratedDocument[] = [];
  for (const po of posToReceive) {
    // Fetch PO details to get item IDs
    const poDetail = await client.get(`/api/purchase-orders/${po.id}`);
    if (!poDetail?.data) { progress.tick(false); progress.tick(false); continue; }

    const poItems = poDetail.data.items ?? poDetail.data.purchase_order_items ?? [];
    if (poItems.length === 0) { progress.tick(false); progress.tick(false); continue; }

    // Create receipt with same items
    const receiptItems = poItems.map((item: any) => ({
      product_id: item.product_id,
      qty: item.qty, // receive full qty
      purchase_order_item_id: item.id,
    }));

    const receiptResp = await client.safePost('/api/purchase-receipts', {
      purchase_order_id: po.id,
      supplier_id: po.refs.supplier_id,
      warehouse_id: po.refs.warehouse_id,
      receipt_date: po.date,
      items: receiptItems,
    }, { phase: 'phase4', entity: 'purchase-receipt', index: 0 });

    if (!receiptResp?.data) { progress.tick(false); progress.tick(false); continue; }
    progress.tick(true);

    // Confirm receipt (triggers stock IN)
    const confirmResp = await client.safePost(`/api/purchase-receipts/${receiptResp.data.id}/confirm`, {}, {
      phase: 'phase4', entity: 'receipt-confirm', index: 0,
    });

    if (confirmResp?.data) {
      confirmedReceipts.push({
        id: receiptResp.data.id,
        orderNumber: receiptResp.data.receipt_number,
        date: po.date,
        status: 'confirmed',
        itemCount: receiptItems.length,
        refs: { purchase_order_id: po.id, supplier_id: po.refs.supplier_id, warehouse_id: po.refs.warehouse_id },
      });
      progress.tick(true);
    } else {
      progress.tick(false);
    }
  }

  // --- 4c: Approve Sales Orders ---
  for (const so of sosToApprove) {
    const resp = await client.safePut(`/api/sales-orders/${so.id}`, { status: 'confirmed' }, {
      phase: 'phase4', entity: 'so-confirm', index: 0,
    });
    progress.tick(!!resp);
    if (resp) so.status = 'confirmed';
  }

  // --- 4d: Create Sales Shipments, Pack, and Confirm ---
  const confirmedShipments: GeneratedDocument[] = [];
  const carrierNames = ['顺丰速运', '京东物流', '德邦快递', '中通快递', '中远海运'];

  for (const so of sosToShip) {
    // Fetch SO details to get item IDs
    const soDetail = await client.get(`/api/sales-orders/${so.id}`);
    if (!soDetail?.data) { progress.tick(false); progress.tick(false); progress.tick(false); continue; }

    const soItems = soDetail.data.items ?? soDetail.data.sales_order_items ?? [];
    if (soItems.length === 0) { progress.tick(false); progress.tick(false); progress.tick(false); continue; }

    // Pick a carrier name
    const carrierName = pick(carrierNames);

    // Create shipment
    const shipmentItems = soItems.map((item: any) => ({
      product_id: item.product_id,
      qty: item.qty ?? item.quantity, // ship full qty
      sales_order_item_id: item.id,
    }));

    const shipResp = await client.safePost('/api/sales-shipments', {
      sales_order_id: so.id,
      customer_id: so.refs.customer_id,
      warehouse_id: so.refs.warehouse_id,
      carrier: carrierName,
      shipment_date: so.date,
      tracking_number: `TRK${Date.now()}${randomInt(1000, 9999)}`,
      items: shipmentItems,
    }, { phase: 'phase4', entity: 'sales-shipment', index: 0 });

    if (!shipResp?.data) { progress.tick(false); progress.tick(false); progress.tick(false); continue; }
    progress.tick(true);

    // Update to 'packed' status (required before confirm)
    const packResp = await client.safePut(`/api/sales-shipments/${shipResp.data.id}`, { status: 'packed' }, {
      phase: 'phase4', entity: 'shipment-pack', index: 0,
    });
    if (!packResp) { progress.tick(false); progress.tick(false); continue; }
    progress.tick(true);

    // Confirm shipment (triggers stock OUT)
    const confirmResp = await client.safePost(`/api/sales-shipments/${shipResp.data.id}/confirm`, {}, {
      phase: 'phase4', entity: 'shipment-confirm', index: 0,
    });

    if (confirmResp?.data) {
      confirmedShipments.push({
        id: shipResp.data.id,
        orderNumber: shipResp.data.shipment_number,
        date: so.date,
        status: 'shipped',
        itemCount: shipmentItems.length,
        refs: { sales_order_id: so.id, customer_id: so.refs.customer_id, warehouse_id: so.refs.warehouse_id },
      });
      progress.tick(true);
    } else {
      progress.tick(false);
    }
  }

  progress.endPhase();
  return { confirmedReceipts, confirmedShipments };
}

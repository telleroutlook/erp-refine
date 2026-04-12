// scripts/seed/phases/phase6-manufacturing.ts
// Phase 6: Manufacturing — BOMs, work orders, quality inspections

import type { SeedApiClient } from '../api-client';
import type { SeedProgress } from '../progress';
import type { GeneratedDocument } from '../types';
import type { IdRegistry } from '../id-registry';
import { randomInt } from '../data/shared';

export async function runPhase6(
  client: SeedApiClient,
  progress: SeedProgress,
  registry: IdRegistry,
  bomData: Array<Record<string, unknown>>,
  confirmedReceipts: GeneratedDocument[],
  orgName: string
): Promise<void> {
  // BOMs + work orders (5) + quality inspections (8)
  const totalOps = bomData.length + 5 + 8;
  progress.startPhase(`Phase 6: Manufacturing & QC [${orgName}]`, totalOps);

  // --- 6a: Create BOMs ---
  const createdBoms: Array<{ id: string; productId: string }> = [];
  for (let i = 0; i < bomData.length; i++) {
    const { items, notes, ...headerFields } = bomData[i] as any;
    const resp = await client.safePost('/api/bom-headers', {
      ...headerFields,
      notes: notes ?? undefined,
      effective_date: '2025-10-01',
      items: (items ?? []).map((item: any, idx: number) => ({
        ...item,
        sequence: idx + 1,
      })),
    }, { phase: 'phase6', entity: 'bom', index: i });

    if (resp?.data) {
      createdBoms.push({ id: resp.data.id, productId: headerFields.product_id });
      progress.tick(true);
    } else {
      progress.tick(false);
    }
  }

  // --- 6b: Create Work Orders ---
  const workOrderDefs = [
    { bomIdx: 0, qty: 50, status: 'completed', productCode: 'FG-VLV-001' },
    { bomIdx: 0, qty: 30, status: 'in_progress', productCode: 'FG-VLV-001' },
    { bomIdx: 1, qty: 10, status: 'completed', productCode: 'FG-PMP-001' },
    { bomIdx: 1, qty: 5, status: 'in_progress', productCode: 'FG-PMP-001' },
    { bomIdx: 2, qty: 20, status: 'released', productCode: 'FG-FLT-001' },
  ];

  const warehouseId = registry.tryGet('warehouse', 'WH-MAIN') ?? registry.tryGet('warehouse', 'WH-RAW');

  for (let i = 0; i < workOrderDefs.length; i++) {
    const woDef = workOrderDefs[i];
    if (woDef.bomIdx >= createdBoms.length) { progress.tick(false); continue; }
    const bom = createdBoms[woDef.bomIdx];

    const resp = await client.safePost('/api/work-orders', {
      product_id: bom.productId,
      bom_header_id: bom.id,
      planned_quantity: woDef.qty,
      warehouse_id: warehouseId,
      start_date: '2025-11-01',
      planned_completion_date: '2026-03-31',
    }, { phase: 'phase6', entity: 'work-order', index: i });

    if (!resp?.data) { progress.tick(false); continue; }
    const woId = resp.data.id;
    progress.tick(true);

    // Release
    await client.safePut(`/api/work-orders/${woId}`, { status: 'released' }, {
      phase: 'phase6', entity: 'wo-release', index: i,
    });

    // If in_progress or completed, issue materials
    if (woDef.status === 'in_progress' || woDef.status === 'completed') {
      await client.safePost(`/api/work-orders/${woId}/issue-materials`, {}, {
        phase: 'phase6', entity: 'wo-issue', index: i,
      });
    }

    // If completed, complete the WO
    if (woDef.status === 'completed') {
      // First update completed_quantity
      await client.safePut(`/api/work-orders/${woId}`, { completed_quantity: woDef.qty }, {
        phase: 'phase6', entity: 'wo-update-qty', index: i,
      });
      await client.safePost(`/api/work-orders/${woId}/complete`, {}, {
        phase: 'phase6', entity: 'wo-complete', index: i,
      });
    }
  }

  // --- 6c: Quality Inspections ---
  const inspectorId = registry.tryGet('employee', 'EMP007') ?? registry.tryGet('employee', 'EMP014');

  // Incoming material inspections (tied to receipts)
  for (let i = 0; i < Math.min(confirmedReceipts.length, 4); i++) {
    const receipt = confirmedReceipts[i];
    const receiptDetail = await client.get(`/api/purchase-receipts/${receipt.id}`);
    const items = receiptDetail?.data?.items ?? receiptDetail?.data?.purchase_receipt_items ?? [];
    if (items.length === 0) { progress.tick(false); continue; }

    const productId = items[0].product_id;
    const totalQuantity = items[0].qty ?? items[0].quantity ?? 100;
    const defectiveQuantity = i === 3 ? randomInt(2, 5) : 0; // 4th inspection has defects
    const qualifiedQuantity = totalQuantity - defectiveQuantity;

    const inspItems: any[] = [];
    if (defectiveQuantity > 0) {
      inspItems.push({
        check_item: '材料缺陷检查',
        check_standard: '无夹渣、气孔等内部缺陷',
        check_result: 'fail',
        measured_value: `发现${defectiveQuantity}件缺陷`,
        notes: '来料抽检发现材料缺陷',
      });
    } else {
      inspItems.push({
        check_item: '外观检查',
        check_standard: '表面无划痕、变形',
        check_result: 'pass',
        measured_value: '合格',
        notes: '',
      });
    }

    const resp = await client.safePost('/api/quality-inspections', {
      product_id: productId,
      inspection_date: receipt.date,
      reference_type: 'purchase_receipt',
      reference_id: receipt.id,
      total_quantity: totalQuantity,
      qualified_quantity: qualifiedQuantity,
      defective_quantity: defectiveQuantity,
      result: defectiveQuantity > 0 ? 'conditional' : 'pass',
      inspector_id: inspectorId,
      items: inspItems,
    }, { phase: 'phase6', entity: 'qi-incoming', index: i });

    progress.tick(!!resp?.data);
  }

  // In-process / finished goods inspections (generic, not tied to specific receipts)
  for (let i = 0; i < 4; i++) {
    const isFinished = i >= 2;
    const productCode = isFinished
      ? (['FG-VLV-001', 'FG-PMP-001'] as const)[i - 2]
      : (['SF-FR-001', 'SF-PCB-001'] as const)[i];

    const productId = registry.tryGet('product', productCode);
    if (!productId) { progress.tick(false); continue; }

    const totalQuantity = isFinished ? randomInt(20, 50) : randomInt(30, 80);
    const defectiveQuantity = i === 1 ? randomInt(1, 3) : 0;

    const inspItems: any[] = [];
    if (defectiveQuantity > 0) {
      inspItems.push({
        check_item: '尺寸检查',
        check_standard: '公差范围 +/-0.05mm',
        check_result: 'fail',
        measured_value: `${defectiveQuantity}件超差`,
        notes: '尺寸超差',
      });
    } else {
      inspItems.push({
        check_item: '功能测试',
        check_standard: '各项指标达标',
        check_result: 'pass',
        measured_value: '合格',
        notes: '',
      });
    }

    const resp = await client.safePost('/api/quality-inspections', {
      product_id: productId,
      inspection_date: `2026-0${i + 1}-15`,
      reference_type: 'work_order',
      reference_id: productId, // use product_id as reference for non-receipt inspections
      total_quantity: totalQuantity,
      qualified_quantity: totalQuantity - defectiveQuantity,
      defective_quantity: defectiveQuantity,
      result: defectiveQuantity > 0 ? 'fail' : 'pass',
      inspector_id: inspectorId,
      items: inspItems,
    }, { phase: 'phase6', entity: 'qi-process', index: i });

    progress.tick(!!resp?.data);
  }

  progress.endPhase();
}

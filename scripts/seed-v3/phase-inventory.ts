import { SeedClient } from '../seed-v2/client';

async function safe<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (err: any) {
    console.warn(`  [SKIP] ${label}: ${String(err.message ?? err).slice(0, 160)}`);
    return null;
  }
}

export async function seedInventory(client: SeedClient, org: string) {
  console.log(`\n  [${org}] Discovering IDs for inventory...`);
  const [products, warehouses] = await Promise.all([
    client.get('/products?_start=0&_end=50').catch(() => []),
    client.get('/warehouses?_start=0&_end=10').catch(() => []),
  ]);

  const prodIds: string[] = (Array.isArray(products) ? products : []).map((x: any) => x.id).filter(Boolean);
  const whIds: string[]   = (Array.isArray(warehouses) ? warehouses : []).map((x: any) => x.id).filter(Boolean);

  if (prodIds.length === 0 || whIds.length === 0) {
    console.warn(`  [${org}] Missing products or warehouses — skipping inventory phase`);
    return;
  }

  // ── Inventory Lots ────────────────────────────────────────────────────────
  console.log(`  [${org}] Creating inventory lots...`);
  const lotDefs = org === 'org1'
    ? [
        { lot_number: 'LOT-RM-AL-2026-01-001',  product_id: prodIds[0],                    warehouse_id: whIds[0], quantity: 500, manufacture_date: '2025-12-01', expiry_date: '2027-12-01', status: 'available' },
        { lot_number: 'LOT-RM-ST-2026-02-001',  product_id: prodIds[1 % prodIds.length],   warehouse_id: whIds[0], quantity: 200, manufacture_date: '2026-01-15', expiry_date: '2028-01-15', status: 'available' },
        { lot_number: 'LOT-RM-RB-2026-01-EXP',  product_id: prodIds[2 % prodIds.length],   warehouse_id: whIds[0], quantity: 80,  manufacture_date: '2025-10-01', expiry_date: '2026-01-01', status: 'expired' },
        { lot_number: 'LOT-RM-AL-2026-03-QRN',  product_id: prodIds[0],                    warehouse_id: whIds[Math.min(1, whIds.length - 1)], quantity: 300, manufacture_date: '2026-02-20', expiry_date: '2028-02-20', status: 'quarantine' },
        { lot_number: 'LOT-FG-VLV-2026-04-001', product_id: prodIds[3 % prodIds.length],   warehouse_id: whIds[0], quantity: 50,  manufacture_date: '2026-04-01', expiry_date: '2028-04-01', status: 'available' },
      ]
    : [
        { lot_number: 'LOT-TE-MCU-2026-01-001', product_id: prodIds[0],                    warehouse_id: whIds[0], quantity: 1000, manufacture_date: '2025-12-10', expiry_date: '2028-12-10', status: 'available' },
        { lot_number: 'LOT-TE-GTW-2026-02-001', product_id: prodIds[1 % prodIds.length],   warehouse_id: whIds[0], quantity: 200,  manufacture_date: '2026-01-20', expiry_date: '2028-01-20', status: 'available' },
        { lot_number: 'LOT-TE-MCU-2025-11-EXP', product_id: prodIds[0],                    warehouse_id: whIds[0], quantity: 50,   manufacture_date: '2025-09-01', expiry_date: '2026-03-01', status: 'expired' },
      ];

  for (let i = 0; i < lotDefs.length; i++) {
    await safe(`lot ${lotDefs[i].lot_number}`, () => client.post('/inventory-lots', lotDefs[i] as any));
  }

  // ── Serial Numbers ────────────────────────────────────────────────────────
  console.log(`  [${org}] Creating serial numbers...`);
  const snDefs = org === 'org1'
    ? [
        { serial_number: 'SN-VLV-2026-0001', product_id: prodIds[3 % prodIds.length], warehouse_id: whIds[0], status: 'in_stock' },
        { serial_number: 'SN-VLV-2026-0002', product_id: prodIds[3 % prodIds.length], warehouse_id: whIds[0], status: 'sold' },
        { serial_number: 'SN-PMP-2026-0001', product_id: prodIds[4 % prodIds.length], warehouse_id: whIds[0], status: 'in_stock' },
        { serial_number: 'SN-PMP-2026-0002', product_id: prodIds[4 % prodIds.length], warehouse_id: whIds[0], status: 'scrapped' },
        { serial_number: 'SN-FLT-2026-0001', product_id: prodIds[5 % prodIds.length], warehouse_id: whIds[0], status: 'returned' },
      ]
    : [
        { serial_number: 'SN-CTL-2026-0001', product_id: prodIds[0],                  warehouse_id: whIds[0], status: 'in_stock' },
        { serial_number: 'SN-CTL-2026-0002', product_id: prodIds[0],                  warehouse_id: whIds[0], status: 'sold' },
        { serial_number: 'SN-GTW-2026-0001', product_id: prodIds[1 % prodIds.length], warehouse_id: whIds[0], status: 'in_stock' },
      ];

  for (const sn of snDefs) {
    await safe(`serial ${sn.serial_number}`, () => client.post('/serial-numbers', sn as any));
  }

  // ── Inventory Counts ──────────────────────────────────────────────────────
  // NOTE: body key is "lines" (not "items") — inventory.ts: const { lines, ...headerFields } = body
  console.log(`  [${org}] Creating inventory counts...`);
  const countDefs = org === 'org1'
    ? [
        { count_date: '2026-01-15', warehouse_id: whIds[0], notes: '一月原材料盘点', workflow: 'complete',
          lines: [
            { product_id: prodIds[0],                  system_quantity: 450, counted_quantity: 448 },
            { product_id: prodIds[1 % prodIds.length], system_quantity: 200, counted_quantity: 202 },
          ] },
        { count_date: '2026-03-20', warehouse_id: whIds[0], notes: '季度库存盘点', workflow: 'in_progress',
          lines: [
            { product_id: prodIds[0],                  system_quantity: 600, counted_quantity: 595 },
            { product_id: prodIds[1 % prodIds.length], system_quantity: 350, counted_quantity: 350 },
            { product_id: prodIds[2 % prodIds.length], system_quantity: 75,  counted_quantity: 70  },
          ] },
        { count_date: '2026-04-20', warehouse_id: whIds[Math.min(1, whIds.length - 1)], notes: '成品仓盘点', workflow: 'none',
          lines: [
            { product_id: prodIds[3 % prodIds.length], system_quantity: 50, counted_quantity: 50 },
          ] },
      ]
    : [
        { count_date: '2026-02-28', warehouse_id: whIds[0], notes: 'Feb stock count', workflow: 'complete',
          lines: [{ product_id: prodIds[0], system_quantity: 800, counted_quantity: 795 }] },
        { count_date: '2026-04-10', warehouse_id: whIds[0], notes: 'Q2 count check', workflow: 'none',
          lines: [{ product_id: prodIds[1 % prodIds.length], system_quantity: 120, counted_quantity: 118 }] },
      ];

  for (let i = 0; i < countDefs.length; i++) {
    const def = countDefs[i];
    const { workflow, lines, ...header } = def;
    const count = await safe(`inventory count #${i + 1}`, () => client.post('/inventory-counts', { ...header, lines }));
    if (!count?.id) continue;

    if (workflow === 'complete' || workflow === 'in_progress') {
      await safe(`count #${i + 1} in_progress`, () => client.put(`/inventory-counts/${count.id}`, { status: 'in_progress' }));
    }
    if (workflow === 'complete') {
      await safe(`count #${i + 1} complete`, () => client.post(`/inventory-counts/${count.id}/complete`, {}));
    }
  }

  console.log(`  [${org}] Phase inventory done.`);
}

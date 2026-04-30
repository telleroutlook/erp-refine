import { SeedClient } from '../seed-v2/client';

async function safe<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (err: any) {
    console.warn(`  [SKIP] ${label}: ${String(err.message ?? err).slice(0, 160)}`);
    return null;
  }
}

export async function seedSalesReturns(client: SeedClient, org: string) {
  console.log(`\n  [${org}] Discovering IDs for sales returns...`);
  const [products, customers, warehouses] = await Promise.all([
    client.get('/products?_start=0&_end=50').catch(() => []),
    client.get('/customers?_start=0&_end=20').catch(() => []),
    client.get('/warehouses?_start=0&_end=10').catch(() => []),
  ]);

  const prodIds: string[]  = (Array.isArray(products) ? products : []).map((x: any) => x.id).filter(Boolean);
  const custIds: string[]  = (Array.isArray(customers) ? customers : []).map((x: any) => x.id).filter(Boolean);
  const whIds: string[]    = (Array.isArray(warehouses) ? warehouses : []).map((x: any) => x.id).filter(Boolean);

  if (prodIds.length === 0 || custIds.length === 0 || whIds.length === 0) {
    console.warn(`  [${org}] Missing required IDs — skipping sales returns`);
    return;
  }

  // ── Sales Returns ─────────────────────────────────────────────────────────
  console.log(`  [${org}] Creating sales returns...`);

  const returnDefs = org === 'org1'
    ? [
        { customer_id: custIds[0], return_date: '2026-02-10', warehouse_id: whIds[0], reason: '产品质量不合格', notes: '客户反映外观缺陷',
          workflow: 'none',
          items: [{ product_id: prodIds[3 % prodIds.length], quantity: 3, unit_price: 520 }] },
        { customer_id: custIds[1 % custIds.length], return_date: '2026-03-05', warehouse_id: whIds[0], reason: '数量超发', notes: '客户多收2件，申请退回',
          workflow: 'approved',
          items: [{ product_id: prodIds[4 % prodIds.length], quantity: 2, unit_price: 3800 }] },
        { customer_id: custIds[2 % custIds.length], return_date: '2026-03-20', warehouse_id: whIds[0], reason: '规格不符', notes: '与订单规格不一致',
          workflow: 'received',
          items: [{ product_id: prodIds[3 % prodIds.length], quantity: 5, unit_price: 520 }] },
        { customer_id: custIds[0], return_date: '2026-04-08', warehouse_id: whIds[0], reason: '客户使用损坏', notes: '人为损坏，拒绝退货',
          workflow: 'rejected',
          items: [{ product_id: prodIds[5 % prodIds.length], quantity: 1, unit_price: 2100 }] },
      ]
    : [
        { customer_id: custIds[0], return_date: '2026-02-15', warehouse_id: whIds[0], reason: 'Quality issue', notes: 'Device malfunction reported',
          workflow: 'none',
          items: [{ product_id: prodIds[0], quantity: 2, unit_price: 1800 }] },
        { customer_id: custIds[1 % custIds.length], return_date: '2026-03-10', warehouse_id: whIds[0], reason: 'Wrong specification', notes: 'Model mismatch',
          workflow: 'received',
          items: [{ product_id: prodIds[1 % prodIds.length], quantity: 3, unit_price: 1350 }] },
        { customer_id: custIds[0], return_date: '2026-04-12', warehouse_id: whIds[0], reason: 'Overshipped', notes: 'Excess units returned',
          workflow: 'approved',
          items: [{ product_id: prodIds[0], quantity: 1, unit_price: 1800 }] },
      ];

  for (let i = 0; i < returnDefs.length; i++) {
    const def = returnDefs[i];
    const { workflow, items, ...header } = def;
    const ret = await safe(`sales return #${i + 1}`, () => client.post('/sales-returns', { ...header, items }));
    if (!ret?.id) continue;

    if (workflow === 'approved' || workflow === 'received') {
      await safe(`sales return #${i + 1} approve`, () => client.put(`/sales-returns/${ret.id}`, { status: 'approved' }));
    }
    if (workflow === 'rejected') {
      await safe(`sales return #${i + 1} reject`, () => client.put(`/sales-returns/${ret.id}`, { status: 'rejected' }));
    }
    if (workflow === 'received') {
      await safe(`sales return #${i + 1} receive`, () =>
        client.post(`/sales-returns/${ret.id}/receive`, {
          receipt_date: def.return_date,
          quantity: items[0].quantity,
          storage_location_id: null,
        })
      );
    }
  }

  console.log(`  [${org}] Phase sales-returns done.`);
}

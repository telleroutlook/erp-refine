// Phase 7: Inventory — Lots, Serial Numbers, Reservations, Inventory Counts
import type { TestContext } from '../../seed-api-test';

const P = 'phase7';

export async function runPhase7(ctx: TestContext, org: string): Promise<void> {
  const { api } = ctx;
  const isOrg2 = org === 'org2';
  const meta = (e: string, i: number) => ({ phase: P, entity: e, index: i });

  // Lookups
  const prods = await api.safeGet<any>('/api/products', { _limit: 5, status: 'active' }, meta('prod-lookup', 0));
  const prodIds = (prods?.data ?? []).map((p: any) => p.id);
  const whs = await api.safeGet<any>('/api/warehouses', { _limit: 3 }, meta('wh-lookup', 0));
  const whIds = (whs?.data ?? []).map((w: any) => w.id);

  if (prodIds.length === 0 || whIds.length === 0) {
    console.log('    ⚠ No products/warehouses, skipping inventory phase');
    return;
  }

  // --- Stock Records (read-only) ---
  const stocks = await api.safeGet<any>('/api/stock-records', { _limit: 5 }, meta('stock-list', 0));
  if (stocks?.data?.[0]) {
    await api.safeGet(`/api/stock-records/${stocks.data[0].id}`, undefined, meta('stock-get', 0));
  }

  // --- Stock Transactions (read-only) ---
  const txns = await api.safeGet<any>('/api/stock-transactions', { _limit: 5 }, meta('stock-txn-list', 0));
  if (txns?.data?.[0]) {
    await api.safeGet(`/api/stock-transactions/${txns.data[0].id}`, undefined, meta('stock-txn-get', 0));
  }

  // --- Inventory Lots ---
  const lotCount = isOrg2 ? 3 : 5;
  const lotStatuses = ['available', 'quarantine', 'expired', 'available', 'consumed'];
  for (let i = 0; i < lotCount; i++) {
    const lot = await api.safePost<any>('/api/inventory-lots', {
      lot_number: `LOT-${org.toUpperCase()}-${Date.now()}-${i}`,
      product_id: prodIds[i % prodIds.length],
      warehouse_id: whIds[i % whIds.length],
      quantity: 100 + i * 50,
      manufacture_date: '2026-03-01',
      expiry_date: i === 2 ? '2026-01-01' : '2027-03-01', // expired for i=2
      status: lotStatuses[i % lotStatuses.length],
    }, meta('lot-create', i));
    if (lot?.data?.id) {
      console.log(`    POST Lot → ${lot.data.id} (${lotStatuses[i % lotStatuses.length]})`);
      ctx.createdIds.set('inventory-lots', [...(ctx.createdIds.get('inventory-lots') ?? []), lot.data.id]);
    }
  }
  await api.safeGet('/api/inventory-lots', { _limit: 10 }, meta('lot-list', 0));

  // --- Serial Numbers ---
  const snCount = isOrg2 ? 3 : 5;
  const snStatuses = ['in_stock', 'sold', 'scrapped', 'returned', 'in_stock'];
  for (let i = 0; i < snCount; i++) {
    const sn = await api.safePost<any>('/api/serial-numbers', {
      serial_number: `SN-${org.toUpperCase()}-${Date.now()}-${i}`,
      product_id: prodIds[i % prodIds.length],
      warehouse_id: whIds[0],
      status: snStatuses[i % snStatuses.length],
    }, meta('sn-create', i));
    if (sn?.data?.id) {
      console.log(`    POST Serial → ${sn.data.id} (${snStatuses[i % snStatuses.length]})`);
      ctx.createdIds.set('serial-numbers', [...(ctx.createdIds.get('serial-numbers') ?? []), sn.data.id]);
    }
  }
  await api.safeGet('/api/serial-numbers', { _limit: 10 }, meta('sn-list', 0));

  // --- Inventory Reservations ---
  const soList = await api.safeGet<any>('/api/sales-orders', { _limit: 3, status: 'approved' }, meta('so-lookup', 0));
  const resCount = isOrg2 ? 2 : 3;
  for (let i = 0; i < resCount; i++) {
    const res = await api.safePost<any>('/api/inventory-reservations', {
      product_id: prodIds[i % prodIds.length],
      warehouse_id: whIds[0],
      reserved_quantity: 10 + i * 5,
      reference_type: 'sales_order',
      reference_id: soList?.data?.[i]?.id ?? soList?.data?.[0]?.id,
      status: i === 0 ? 'active' : 'released',
      expires_at: '2026-05-31T23:59:59Z',
    }, meta('reservation-create', i));
    if (res?.data?.id) {
      console.log(`    POST Reservation → ${res.data.id}`);
      ctx.createdIds.set('inventory-reservations', [...(ctx.createdIds.get('inventory-reservations') ?? []), res.data.id]);
    }
  }
  await api.safeGet('/api/inventory-reservations', { _limit: 10 }, meta('reservation-list', 0));

  // --- Inventory Counts ---
  // Columns: count_date, warehouse_id, notes, count_number (auto)
  // Lines: product_id, system_quantity, counted_quantity, storage_location_id, notes
  for (let i = 0; i < 2; i++) {
    const lines = [
      { product_id: prodIds[0], system_quantity: 100, counted_quantity: i === 0 ? 98 : 100 },
      { product_id: prodIds[1 % prodIds.length], system_quantity: 50, counted_quantity: i === 0 ? 52 : 50 },
    ];
    const count = await api.safePost<any>('/api/inventory-counts', {
      count_date: `2026-04-${String(20 + i).padStart(2, '0')}`,
      warehouse_id: whIds[0],
      notes: `API seed count #${i + 1}`,
      items: lines,
    }, meta('count-create', i));
    if (count?.data?.id) {
      console.log(`    POST Inventory Count → ${count.data.id}`);
      ctx.createdIds.set('inventory-counts', [...(ctx.createdIds.get('inventory-counts') ?? []), count.data.id]);

      // Progress count[0] through workflow
      if (i === 0) {
        await api.safePut(`/api/inventory-counts/${count.data.id}`, { status: 'in_progress' }, meta('count-progress', 0));
        await api.safePut(`/api/inventory-counts/${count.data.id}`, { status: 'completed' }, meta('count-complete', 0));
        console.log(`    Count ${count.data.id} → completed`);
      }
    }
  }
  await api.safeGet('/api/inventory-counts', { _limit: 10 }, meta('count-list', 0));
  await api.safeGet('/api/inventory-count-lines', { _limit: 10 }, meta('count-lines-list', 0));

  console.log(`    Phase 7 (${org}) done`);
}

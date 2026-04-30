import { SeedClient } from '../seed-v2/client';

async function safe<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (err: any) {
    console.warn(`  [SKIP] ${label}: ${String(err.message ?? err).slice(0, 160)}`);
    return null;
  }
}

export async function seedMissingMaster(client: SeedClient, org: string) {
  console.log(`\n  [${org}] Discovering IDs...`);
  const [products, suppliers] = await Promise.all([
    client.get('/products?_start=0&_end=50').catch(() => []),
    client.get('/suppliers?_start=0&_end=20').catch(() => []),
  ]);
  const prodIds: string[] = (Array.isArray(products) ? products : []).map((x: any) => x.id).filter(Boolean);
  const supIds: string[] = (Array.isArray(suppliers) ? suppliers : []).map((x: any) => x.id).filter(Boolean);

  if (prodIds.length === 0) {
    console.warn(`  [${org}] No products found, skipping price list lines`);
  }

  // ── Carriers ──────────────────────────────────────────────────────────────
  console.log(`  [${org}] Creating carriers...`);
  const carrierDefs = org === 'org1'
    ? [
        { code: 'SF-V3',  name: '顺丰速运',  carrier_type: 'express', contact: '张经理', phone: '400-111-1111', tracking_url_template: 'https://www.sf-express.com/track/{tracking_number}', is_active: true },
        { code: 'JD-V3',  name: '京东物流',  carrier_type: 'freight', contact: '李经理', phone: '400-600-5566', tracking_url_template: 'https://www.jdl.com/track/{tracking_number}',          is_active: true },
        { code: 'ZT-V3',  name: '中通快递',  carrier_type: 'express', contact: '王经理', phone: '400-821-6789', tracking_url_template: null,                                                    is_active: true },
        { code: 'YTO-V3', name: '圆通速递',  carrier_type: 'express', contact: '陈经理', phone: '400-600-6789', tracking_url_template: null,                                                    is_active: false },
      ]
    : [
        { code: 'DHL-V3', name: 'DHL Express', carrier_type: 'express', contact: 'Mr. Chen', phone: '+86-400-888-3339', tracking_url_template: 'https://www.dhl.com/track/{tracking_number}', is_active: true },
        { code: 'FDX-V3', name: 'FedEx',       carrier_type: 'express', contact: 'Ms. Li',   phone: '+86-400-886-1228', tracking_url_template: 'https://www.fedex.com/track/{tracking_number}', is_active: true },
        { code: 'UPS-V3', name: 'UPS',         carrier_type: 'freight', contact: 'Mr. Wang', phone: '+86-400-820-8388', tracking_url_template: null,                                              is_active: true },
      ];

  for (const def of carrierDefs) {
    await safe(`carrier ${def.code}`, () => client.post('/carriers', def as any));
  }

  // ── Price Lists ───────────────────────────────────────────────────────────
  console.log(`  [${org}] Creating price lists...`);
  const plDefs = org === 'org1'
    ? [
        { code: 'PL-STD-2026', name: '2026年度标准价格表', currency: 'CNY', effective_from: '2026-01-01', effective_to: '2026-12-31', is_default: true,  status: 'active' },
        { code: 'PL-VIP-2026', name: '2026年度VIP客户价',  currency: 'CNY', effective_from: '2026-01-01', effective_to: '2026-12-31', is_default: false, status: 'active' },
        { code: 'PL-USD-2026', name: '2026年度出口价格表', currency: 'USD', effective_from: '2026-04-01', effective_to: '2026-12-31', is_default: false, status: 'active' },
      ]
    : [
        { code: 'PL-TW-STD-2026', name: '2026 Standard Price',      currency: 'CNY', effective_from: '2026-01-01', effective_to: '2026-12-31', is_default: true,  status: 'active' },
        { code: 'PL-TW-USD-2026', name: '2026 International Price', currency: 'USD', effective_from: '2026-01-01', effective_to: '2026-12-31', is_default: false, status: 'active' },
      ];

  const basePrices = [150, 320, 520, 1200, 2100, 3800, 850, 450];

  for (const pl of plDefs) {
    const created = await safe(`price list ${pl.code}`, () => client.post('/price-lists', pl as any));
    if (!created?.id || prodIds.length === 0) continue;
    const isVip = pl.code.includes('VIP');
    const sampleProds = prodIds.slice(0, Math.min(5, prodIds.length));
    for (let i = 0; i < sampleProds.length; i++) {
      const basePrice = basePrices[i % basePrices.length];
      await safe(`price list line ${pl.code}[${i}]`, () =>
        client.post('/price-list-lines', {
          price_list_id: created.id,
          product_id: sampleProds[i],
          unit_price: isVip ? basePrice * 0.95 : basePrice,
          min_quantity: isVip ? 10 : 1,
          discount_rate: isVip ? 0.05 : 0,
        })
      );
    }
  }

  // ── Profile Change Requests ───────────────────────────────────────────────
  console.log(`  [${org}] Creating profile change requests...`);
  const pcrDefs = org === 'org1'
    ? [
        { request_type: 'bank_account_change', notes: '供应商银行账户变更申请', status: 'pending' },
        { request_type: 'address_change',      notes: '供应商地址变更',         status: 'approved' },
      ]
    : [
        { request_type: 'contact_update', notes: 'Supplier contact info update', status: 'pending' },
      ];

  for (let i = 0; i < pcrDefs.length; i++) {
    const supId = supIds[i % Math.max(supIds.length, 1)];
    if (!supId) { console.warn(`  [${org}] No supplier ID for profile change request`); continue; }
    await safe(`profile change request ${i + 1}`, () =>
      client.post('/profile-change-requests', {
        supplier_id: supId,
        ...pcrDefs[i],
      })
    );
  }

  console.log(`  [${org}] Phase missing-master done.`);
}

// Phase 1: Master Data per-record CRUD
import type { TestContext } from '../../seed-api-test';

const P = 'phase1';

async function crud(
  ctx: TestContext,
  resource: string,
  createPayload: Record<string, any>,
  updateField: Record<string, any>,
  canWrite = true,
) {
  const { api } = ctx;
  const path = `/api/${resource}`;
  const meta = (e: string, i: number) => ({ phase: P, entity: e, index: i });

  // GET list
  const list = await api.safeGet<any>(path, { _limit: 5 }, meta(resource + '-list', 0));
  const listCount = list?.data?.length ?? 0;
  console.log(`    GET ${path} → ${listCount} items`);

  let createdId: string | null = null;
  if (canWrite) {
    // POST create
    const created = await api.safePost<any>(path, createPayload, meta(resource + '-create', 0));
    createdId = created?.data?.id ?? null;
    if (createdId) {
      console.log(`    POST ${path} → ${createdId}`);
      ctx.createdIds.set(resource, [...(ctx.createdIds.get(resource) ?? []), createdId]);
    }
  }

  // GET by ID (use created or first from list)
  const idToGet = createdId ?? list?.data?.[0]?.id;
  if (idToGet) {
    await api.safeGet(`${path}/${idToGet}`, undefined, meta(resource + '-get', 0));
  }

  if (canWrite && createdId) {
    // PUT update
    await api.safePut(`${path}/${createdId}`, updateField, meta(resource + '-update', 0));
  }
}

export async function runPhase1(ctx: TestContext, org: string): Promise<void> {
  const { api } = ctx;
  const isOrg2 = org === 'org2';

  // Product Categories
  await crud(ctx, 'product-categories', {
    name: isOrg2 ? '测试分类-T' : '测试分类-API',
    code: isOrg2 ? 'CAT-TEST-T' : 'CAT-TEST-A',
  }, { name: isOrg2 ? '测试分类-T-更新' : '测试分类-API-更新' });

  // Products — 3 types
  const productTypes = [
    { name: '测试产品-API', code: isOrg2 ? 'PROD-T-1' : 'PROD-A-1', type: 'product', purchase_price: 100, sale_price: 150, status: 'active' },
    { name: '测试原材料-API', code: isOrg2 ? 'MAT-T-1' : 'MAT-A-1', type: 'material', purchase_price: 50, status: 'active' },
    { name: '测试服务-API', code: isOrg2 ? 'SVC-T-1' : 'SVC-A-1', type: 'service', purchase_price: 200, status: 'active' },
  ];
  for (let i = 0; i < productTypes.length; i++) {
    const p = productTypes[i];
    const created = await api.safePost<any>('/api/products', p, { phase: P, entity: 'product-create', index: i });
    if (created?.data?.id) {
      ctx.createdIds.set('products', [...(ctx.createdIds.get('products') ?? []), created.data.id]);
      console.log(`    POST /api/products → ${created.data.id} (${p.type})`);
    }
  }
  // GET + GET/:id
  const prodList = await api.safeGet<any>('/api/products', { _limit: 3 }, { phase: P, entity: 'products-list', index: 0 });
  if (prodList?.data?.[0]) {
    await api.safeGet(`/api/products/${prodList.data[0].id}`, undefined, { phase: P, entity: 'products-get', index: 0 });
    // PUT update
    await api.safePut(`/api/products/${prodList.data[0].id}`, { sale_price: 999 }, { phase: P, entity: 'products-update', index: 0 });
  }

  // Warehouses
  await crud(ctx, 'warehouses', {
    name: isOrg2 ? '中转仓-T' : '中转仓-API',
    code: isOrg2 ? 'WH-TR-T' : 'WH-TR-A',
    type: 'transit',
    status: 'active',
  }, { status: 'active' });

  // Warehouse Locations → route is /api/storage-locations
  const whList = await api.safeGet<any>('/api/warehouses', { _limit: 1 }, { phase: P, entity: 'wh-list', index: 0 });
  if (whList?.data?.[0]) {
    await crud(ctx, 'storage-locations', {
      warehouse_id: whList.data[0].id,
      name: isOrg2 ? 'A-01-T' : 'A-01-API',
      code: isOrg2 ? 'LOC-T-01' : 'LOC-A-01',
      zone: 'A',
    }, { zone: 'B' });
  }

  // Tax Codes — route not implemented, skip POST, just try GET
  await api.safeGet('/api/tax-codes', { _limit: 5 }, { phase: P, entity: 'tax-codes-list', index: 0 });

  // Units of Measure → route is /api/uoms (global, read-only)
  await api.safeGet('/api/uoms', { _limit: 5 }, { phase: P, entity: 'uoms-list', index: 0 });

  // Carriers — columns: code, name, carrier_type, contact, phone, tracking_url_template, is_active
  const carriers = [
    { name: '顺丰速运', code: isOrg2 ? 'SF-T' : 'SF-A', carrier_type: 'express', contact: '张经理', phone: '400-111-1111' },
    { name: '京东物流', code: isOrg2 ? 'JD-T' : 'JD-A', carrier_type: 'freight', contact: '李经理', phone: '400-222-2222' },
    { name: '中通快递', code: isOrg2 ? 'ZT-T' : 'ZT-A', carrier_type: 'express', contact: '王经理', phone: '400-333-3333' },
  ];
  for (let i = 0; i < carriers.length; i++) {
    await api.safePost('/api/carriers', carriers[i], { phase: P, entity: 'carrier', index: i });
  }
  await api.safeGet('/api/carriers', { _limit: 5 }, { phase: P, entity: 'carriers-list', index: 0 });

  // Departments — GET + create 1
  await crud(ctx, 'departments', {
    name: isOrg2 ? '质量检测部-T' : '质量检测部-API',
    code: isOrg2 ? 'QC-T' : 'QC-A',
    status: 'active',
  }, { status: 'active' });

  // Employees — columns: name, email, employee_number, position, status, department_id
  const deptList = await api.safeGet<any>('/api/departments', { _limit: 1 }, { phase: P, entity: 'dept-for-emp', index: 0 });
  await crud(ctx, 'employees', {
    name: isOrg2 ? '测试员工-T' : '测试员工-API',
    email: isOrg2 ? 'test-t@erp.demo' : 'test-a@erp.demo',
    employee_number: isOrg2 ? 'EMP-T-99' : 'EMP-A-99',
    position: 'user',
    status: 'active',
    department_id: deptList?.data?.[0]?.id,
  }, { status: 'active' });

  // Exchange Rates
  await crud(ctx, 'exchange-rates', {
    from_currency: 'USD',
    to_currency: 'CNY',
    rate: 7.24,
    rate_type: 'spot',
    effective_date: '2026-04-22',
  }, { rate: 7.25 });

  // Organizations (read-only)
  await crud(ctx, 'organizations', {}, {}, false);

  // Number Sequences (read-only for non-admin)
  await crud(ctx, 'number-sequences', {}, {}, false);

  // Account Subjects — columns: code, name, category, balance_direction, is_leaf, status, parent_id
  await crud(ctx, 'account-subjects', {
    code: isOrg2 ? '9901-T' : '9901-A',
    name: isOrg2 ? '测试科目-T' : '测试科目-API',
    category: 'expense',
    balance_direction: 'debit',
    is_leaf: true,
    status: 'active',
  }, { name: isOrg2 ? '测试科目-T-更新' : '测试科目-API-更新' });

  // Cost Centers — columns: code, name, is_active, manager_id, parent_id
  await crud(ctx, 'cost-centers', {
    code: isOrg2 ? 'CC-T-99' : 'CC-A-99',
    name: isOrg2 ? '测试成本中心-T' : '测试成本中心-API',
    is_active: true,
  }, { name: isOrg2 ? '测试成本中心-T-更新' : '测试成本中心-API-更新' });

  // Price Lists
  const pl = await api.safePost<any>('/api/price-lists', {
    name: isOrg2 ? '标准价格表-T' : '标准价格表-API',
    code: isOrg2 ? 'PL-STD-T' : 'PL-STD-A',
    status: 'active',
    effective_from: '2026-01-01',
    effective_to: '2026-12-31',
  }, { phase: P, entity: 'price-list', index: 0 });
  if (pl?.data?.id) {
    console.log(`    POST /api/price-lists → ${pl.data.id}`);
    // Price List Lines — need a product
    const prods = ctx.createdIds.get('products') ?? [];
    if (prods.length > 0) {
      await api.safePost('/api/price-list-lines', {
        price_list_id: pl.data.id,
        product_id: prods[0],
        unit_price: 120,
        min_quantity: 1,
      }, { phase: P, entity: 'price-list-line', index: 0 });
    }
  }
  await api.safeGet('/api/price-lists', { _limit: 5 }, { phase: P, entity: 'price-lists-list', index: 0 });
  await api.safeGet('/api/price-list-lines', { _limit: 5 }, { phase: P, entity: 'price-list-lines-list', index: 0 });

  console.log(`    Phase 1 (${org}) done`);
}

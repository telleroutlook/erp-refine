// Phase 2: Partners — Customers & Suppliers with nested resources
import type { TestContext } from '../../seed-api-test';

const P = 'phase2';

export async function runPhase2(ctx: TestContext, org: string): Promise<void> {
  const { api } = ctx;
  const isOrg2 = org === 'org2';
  const meta = (e: string, i: number) => ({ phase: P, entity: e, index: i });

  // --- Customers ---
  const customers = [
    {
      name: isOrg2 ? '客户Alpha-T' : '客户Alpha-API',
      code: isOrg2 ? 'CUST-A-T' : 'CUST-A-API',
      type: 'company',
      contact: '王先生',
      phone: '13800001111',
      email: 'alpha@example.com',
      status: 'active',
      credit_limit: 500000,
      payment_terms: 30,
    },
    {
      name: isOrg2 ? '客户Beta-T' : '客户Beta-API',
      code: isOrg2 ? 'CUST-B-T' : 'CUST-B-API',
      type: 'individual',
      contact: '李女士',
      phone: '13800002222',
      email: 'beta@example.com',
      status: 'active',
      credit_limit: 100000,
      payment_terms: 15,
    },
  ];

  for (let i = 0; i < customers.length; i++) {
    const result = await api.safePost<any>('/api/customers', customers[i], meta('customer-create', i));
    const custId = result?.data?.id;
    if (!custId) continue;
    ctx.createdIds.set('customers', [...(ctx.createdIds.get('customers') ?? []), custId]);
    console.log(`    POST /api/customers → ${custId}`);

    // Customer Addresses
    const addresses = [
      { address_type: 'billing', contact_name: customers[i].contact, contact_phone: customers[i].phone, address: '北京市朝阳区建国路88号', city: '北京', province: '北京', postal_code: '100020', country: 'CN', is_default: true },
      { address_type: 'shipping', contact_name: customers[i].contact, contact_phone: customers[i].phone, address: '上海市浦东新区陆家嘴环路100号', city: '上海', province: '上海', postal_code: '200120', country: 'CN', is_default: false },
    ];
    for (let j = 0; j < addresses.length; j++) {
      await api.safePost(`/api/customers/${custId}/addresses`, addresses[j], meta('cust-addr', i * 10 + j));
    }
    // GET addresses
    await api.safeGet(`/api/customers/${custId}/addresses`, undefined, meta('cust-addr-list', i));

    // Customer Bank Accounts
    await api.safePost(`/api/customers/${custId}/bank-accounts`, {
      bank_name: '中国工商银行',
      account_number: `6222${1000000000 + i}`,
      account_name: customers[i].name,
      currency: 'CNY',
      is_default: true,
    }, meta('cust-bank', i));
    await api.safeGet(`/api/customers/${custId}/bank-accounts`, undefined, meta('cust-bank-list', i));
  }

  // GET customers list + by ID
  const custList = await api.safeGet<any>('/api/customers', { _limit: 5 }, meta('customers-list', 0));
  if (custList?.data?.[0]) {
    await api.safeGet(`/api/customers/${custList.data[0].id}`, undefined, meta('customers-get', 0));
    // PUT update
    await api.safePut(`/api/customers/${custList.data[0].id}`, { classification: 'VIP' }, meta('customers-update', 0));
  }

  // --- Suppliers ---
  const suppliers = [
    {
      name: isOrg2 ? '供应商Gamma-T' : '供应商Gamma-API',
      code: isOrg2 ? 'SUP-G-T' : 'SUP-G-API',
      supplier_type: 'product',
      status: 'active',
      contact_person: '赵经理',
      contact_phone: '13900001111',
      contact_email: 'gamma@supplier.com',
      payment_terms: 60,
      lead_time_days: 7,
    },
    {
      name: isOrg2 ? '供应商Delta-T' : '供应商Delta-API',
      code: isOrg2 ? 'SUP-D-T' : 'SUP-D-API',
      supplier_type: 'service',
      status: 'active',
      contact_person: '孙经理',
      contact_phone: '13900002222',
      contact_email: 'delta@supplier.com',
      payment_terms: 30,
      lead_time_days: 14,
    },
  ];

  for (let i = 0; i < suppliers.length; i++) {
    const result = await api.safePost<any>('/api/suppliers', suppliers[i], meta('supplier-create', i));
    const supId = result?.data?.id;
    if (!supId) continue;
    ctx.createdIds.set('suppliers', [...(ctx.createdIds.get('suppliers') ?? []), supId]);
    console.log(`    POST /api/suppliers → ${supId}`);

    // Supplier Sites
    await api.safePost(`/api/suppliers/${supId}/sites`, {
      site_code: `SITE-${i + 1}`,
      site_name: `${suppliers[i].name} 总部`,
      address: '深圳市南山区科技园路1号',
      city: '深圳',
      province: '广东',
      postal_code: '518000',
      country: 'CN',
      contact_name: suppliers[i].contact_person,
      contact_phone: suppliers[i].contact_phone,
      is_active: true,
    }, meta('sup-site', i));
    await api.safeGet(`/api/suppliers/${supId}/sites`, undefined, meta('sup-site-list', i));

    // Supplier Bank Accounts
    await api.safePost(`/api/suppliers/${supId}/bank-accounts`, {
      bank_name: '中国建设银行',
      account_number: `6227${2000000000 + i}`,
      account_name: suppliers[i].name,
      currency: 'CNY',
      is_default: true,
    }, meta('sup-bank', i));
    await api.safeGet(`/api/suppliers/${supId}/bank-accounts`, undefined, meta('sup-bank-list', i));

    // Supplier Contacts
    const contacts = [
      { name: '张三', title: '销售经理', email: 'zhang@supplier.com', phone: '13700001111', is_default: true },
      { name: '李四', title: '技术支持', email: 'li@supplier.com', phone: '13700002222', is_default: false },
    ];
    for (let j = 0; j < contacts.length; j++) {
      await api.safePost(`/api/suppliers/${supId}/contacts`, contacts[j], meta('sup-contact', i * 10 + j));
    }
    await api.safeGet(`/api/suppliers/${supId}/contacts`, undefined, meta('sup-contact-list', i));

    // Supplier Certificates
    await api.safePost(`/api/suppliers/${supId}/certificates`, {
      certificate_type: 'ISO 9001',
      certificate_number: `ISO-${Date.now()}-${i}`,
      issued_by: '中国质量认证中心',
      issued_date: '2025-01-15',
      expiry_date: '2028-01-14',
      status: 'valid',
    }, meta('sup-cert', i));
    await api.safeGet(`/api/suppliers/${supId}/certificates`, undefined, meta('sup-cert-list', i));
  }

  // GET suppliers list + by ID
  const supList = await api.safeGet<any>('/api/suppliers', { _limit: 5 }, meta('suppliers-list', 0));
  if (supList?.data?.[0]) {
    await api.safeGet(`/api/suppliers/${supList.data[0].id}`, undefined, meta('suppliers-get', 0));
    await api.safePut(`/api/suppliers/${supList.data[0].id}`, { notes: 'Updated by API test' }, meta('suppliers-update', 0));
  }

  // Profile Change Requests
  const supIds = ctx.createdIds.get('suppliers') ?? [];
  if (supIds.length > 0) {
    await api.safePost('/api/profile-change-requests', {
      supplier_id: supIds[0],
      request_type: 'bank_account_change',
      change_data: { bank_name: '中国农业银行' },
      status: 'pending',
    }, meta('profile-change', 0));
    await api.safeGet('/api/profile-change-requests', { _limit: 5 }, meta('profile-change-list', 0));
  }

  console.log(`    Phase 2 (${org}) done`);
}

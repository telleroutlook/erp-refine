// scripts/seed/data/org2-master.ts
// Organization 2 (TECH) — Tech trading company
// Master data generators

import type { ProductInfo } from '../types';

export function org2Departments() {
  return [
    { code: 'EXEC', name: 'Executive Office' },
    { code: 'SALES', name: 'Sales' },
    { code: 'OPS', name: 'Operations' },
    { code: 'FIN', name: 'Finance' },
    { code: 'TECH', name: 'Technical Support' },
  ];
}

export function org2Employees() {
  return [
    { name: 'Alex Chen', email: 'alex@tech.demo', phone: '+86-13900100001', position: 'CEO', employee_number: 'T-EMP001' },
    { name: 'Sarah Wang', email: 'sarah@tech.demo', phone: '+86-13900100002', position: 'Sales Director', employee_number: 'T-EMP002' },
    { name: 'Mike Liu', email: 'mike@tech.demo', phone: '+86-13900100003', position: 'Operations Manager', employee_number: 'T-EMP003' },
    { name: 'Jenny Zhou', email: 'jenny@tech.demo', phone: '+86-13900100004', position: 'Finance Manager', employee_number: 'T-EMP004' },
    { name: 'David Li', email: 'david@tech.demo', phone: '+86-13900100005', position: 'Account Manager', employee_number: 'T-EMP005' },
    { name: 'Amy Xu', email: 'amy@tech.demo', phone: '+86-13900100006', position: 'Logistics Coordinator', employee_number: 'T-EMP006' },
    { name: 'Tom Zhang', email: 'tom@tech.demo', phone: '+86-13900100007', position: 'Technical Lead', employee_number: 'T-EMP007' },
    { name: 'Lisa Huang', email: 'lisa@tech.demo', phone: '+86-13900100008', position: 'Accountant', employee_number: 'T-EMP008' },
  ];
}

export function org2ProductCategories() {
  return [
    { code: 'COMP', name: 'Components', level: 1 },
    { code: 'SYS', name: 'Systems', level: 1 },
    { code: 'ACC', name: 'Accessories', level: 1 },
  ];
}

export function org2Products(): Array<Record<string, unknown> & { _meta: ProductInfo }> {
  const products = [
    { code: 'TE-MCU-001', name: 'ARM Cortex M4 Module', type: 'material', cost_price: 45, sale_price: 65, list_price: 65, unit: 'PCS', safety_stock_days: 14 },
    { code: 'TE-PCB-001', name: '4-Layer PCB Board', type: 'material', cost_price: 12, sale_price: 18, list_price: 18, unit: 'PCS', safety_stock_days: 21 },
    { code: 'TE-SEN-001', name: 'IoT Sensor Kit', type: 'material', cost_price: 85, sale_price: 120, list_price: 120, unit: 'SET', safety_stock_days: 14 },
    { code: 'TE-PWR-001', name: 'DC Power Supply 24V', type: 'material', cost_price: 35, sale_price: 52, list_price: 52, unit: 'PCS', safety_stock_days: 7 },
    { code: 'TE-CAB-001', name: 'Industrial Cable Set', type: 'material', cost_price: 22, sale_price: 35, list_price: 35, unit: 'SET', safety_stock_days: 7 },
    { code: 'TE-CTL-001', name: 'PLC Controller Unit', type: 'finished_good', cost_price: 1200, sale_price: 1800, list_price: 1800, unit: 'PCS', safety_stock_days: 14 },
    { code: 'TE-GTW-001', name: 'IoT Gateway Pro', type: 'finished_good', cost_price: 850, sale_price: 1350, list_price: 1350, unit: 'PCS', safety_stock_days: 14 },
    { code: 'TE-DIS-001', name: 'Industrial Display 10"', type: 'finished_good', cost_price: 420, sale_price: 680, list_price: 680, unit: 'PCS', safety_stock_days: 7 },
    { code: 'TE-KIT-001', name: 'Smart Factory Starter Kit', type: 'finished_good', cost_price: 3500, sale_price: 5200, list_price: 5200, unit: 'SET', safety_stock_days: 7 },
    { code: 'TE-ACC-001', name: 'Accessory Pack', type: 'consumable', cost_price: 15, sale_price: 28, list_price: 28, unit: 'SET', safety_stock_days: 30 },
  ];

  return products.map((p) => ({
    ...p,
    _meta: { code: p.code, type: p.type, costPrice: p.cost_price, listPrice: p.list_price },
  }));
}

export function org2ProductInfos(): ProductInfo[] {
  return org2Products().map((p) => p._meta);
}

export function org2Customers() {
  return [
    { code: 'TC01', name: 'Shenzhen Smart Systems', customer_type: 'enterprise', classification: 'key', email: 'order@sz-smart.com', phone: '0755-88001234', credit_limit: 2000000, payment_terms: 30, contact: '李明' },
    { code: 'TC02', name: 'Samsung Electronics Vietnam', customer_type: 'enterprise', classification: 'vip', email: 'proc@samsung-vn.com', phone: '+84-28-3824-1234', credit_limit: 800000, payment_terms: 60, contact: 'Nguyen' },
    { code: 'TC03', name: 'Foxconn Industrial IoT', customer_type: 'enterprise', classification: 'vip', email: 'iot@foxconn.com', phone: '0755-27001234', credit_limit: 5000000, payment_terms: 45, contact: '陈工' },
    { code: 'TC04', name: 'Siemens Asia Pacific', customer_type: 'enterprise', classification: 'key', email: 'apac@siemens.com', phone: '+65-6490-1234', credit_limit: 1000000, payment_terms: 60, contact: 'Mueller' },
    { code: 'TC05', name: 'BYD Electronic', customer_type: 'enterprise', classification: 'key', email: 'elec@byd.com', phone: '0755-89001234', credit_limit: 3000000, payment_terms: 30, contact: '王工' },
    { code: 'TC06', name: 'Mitsubishi Electric', customer_type: 'enterprise', classification: 'standard', email: 'order@mitsubishi-e.jp', phone: '+81-3-3218-1234', credit_limit: 500000, payment_terms: 60, contact: 'Suzuki' },
    { code: 'TC07', name: 'Haier Smart Home', customer_type: 'enterprise', classification: 'standard', email: 'smart@haier.com', phone: '0532-88001234', credit_limit: 1500000, payment_terms: 30, contact: '张经理' },
    { code: 'TC08', name: 'Bosch Connected Industry', customer_type: 'enterprise', classification: 'standard', email: 'ci@bosch.com', phone: '+49-711-811-1234', credit_limit: 600000, payment_terms: 60, contact: 'Schmidt' },
  ];
}

export function org2Suppliers() {
  return [
    { code: 'TS01', name: 'Texas Instruments China', supplier_type: 'material', contact_email: 'sales@ti-china.com', contact_phone: '021-23073000', country: 'CN', currency: 'USD', payment_terms: '45', lead_time_days: 14, reliability_score: 0.96, contact_person: '赵经理' },
    { code: 'TS02', name: 'Shenzhen PCB Factory', supplier_type: 'material', contact_email: 'order@sz-pcb.com', contact_phone: '0755-26001234', country: 'CN', currency: 'CNY', payment_terms: '30', lead_time_days: 10, reliability_score: 0.90, contact_person: '周工' },
    { code: 'TS03', name: 'Mouser Electronics', supplier_type: 'material', contact_email: 'asia@mouser.com', contact_phone: '+1-817-804-3800', country: 'US', currency: 'USD', payment_terms: '30', lead_time_days: 7, reliability_score: 0.94, contact_person: 'Johnson' },
    { code: 'TS04', name: 'DHL Express', supplier_type: 'logistics', contact_email: 'cn-biz@dhl.com', contact_phone: '400-810-8000', country: 'DE', currency: 'CNY', payment_terms: '30', lead_time_days: 3, reliability_score: 0.93, contact_person: '物流顾问' },
    { code: 'TS05', name: 'Nanjing Assembly Services', supplier_type: 'subcontractor', contact_email: 'biz@nj-assembly.com', contact_phone: '025-86001234', country: 'CN', currency: 'CNY', payment_terms: '30', lead_time_days: 14, reliability_score: 0.88, contact_person: '吴总' },
  ];
}

export function org2Warehouses() {
  return [
    { code: 'TW-MAIN', name: 'Main Warehouse', location: 'Shenzhen, China', type: 'standard', status: 'active' },
    { code: 'TW-SHIP', name: 'Shipping Hub', location: 'Hong Kong SAR', type: 'bonded', status: 'active' },
  ];
}

export function org2AccountSubjects() {
  return [
    { code: '1001', name: 'Cash', category: 'asset', balance_direction: 'debit', is_leaf: true },
    { code: '1002', name: 'Bank Deposits', category: 'asset', balance_direction: 'debit', is_leaf: true },
    { code: '1122', name: 'Accounts Receivable', category: 'asset', balance_direction: 'debit', is_leaf: true },
    { code: '1401', name: 'Inventory', category: 'asset', balance_direction: 'debit', is_leaf: true },
    { code: '1601', name: 'Fixed Assets', category: 'asset', balance_direction: 'debit', is_leaf: true },
    { code: '2202', name: 'Accounts Payable', category: 'liability', balance_direction: 'credit', is_leaf: true },
    { code: '2221', name: 'Tax Payable', category: 'liability', balance_direction: 'credit', is_leaf: true },
    { code: '4001', name: 'Paid-in Capital', category: 'equity', balance_direction: 'credit', is_leaf: true },
    { code: '4103', name: 'Current Year Profit', category: 'equity', balance_direction: 'credit', is_leaf: true },
    { code: '6001', name: 'Sales Revenue', category: 'revenue', balance_direction: 'credit', is_leaf: true },
    { code: '6401', name: 'Cost of Goods Sold', category: 'expense', balance_direction: 'debit', is_leaf: true },
    { code: '6601', name: 'Selling Expenses', category: 'expense', balance_direction: 'debit', is_leaf: true },
    { code: '6602', name: 'G&A Expenses', category: 'expense', balance_direction: 'debit', is_leaf: true },
  ];
}

export function org2CostCenters() {
  return [
    { code: 'CC-EXEC', name: 'Executive' },
    { code: 'CC-SALES', name: 'Sales' },
    { code: 'CC-OPS', name: 'Operations' },
  ];
}

export function org2ExchangeRates() {
  const rates: Array<Record<string, unknown>> = [];
  const usdRates = [7.09, 7.06, 7.11];
  const months = ['2026-01-01', '2026-02-01', '2026-03-01'];
  for (let i = 0; i < months.length; i++) {
    rates.push(
      { from_currency: 'USD', to_currency: 'CNY', rate_type: 'spot', rate: usdRates[i], effective_date: months[i] },
    );
  }
  return rates;
}

// scripts/seed/data/org2-master.ts
// Organization 2 (TECH) — Tech trading company
// Master data generators

import type { ProductInfo } from '../types';

export function org2Departments() {
  return [
    { code: 'EXEC', name: 'Executive Office', level: 1 },
    { code: 'SALES', name: 'Sales', level: 1 },
    { code: 'OPS', name: 'Operations', level: 1 },
    { code: 'FIN', name: 'Finance', level: 1 },
    { code: 'TECH', name: 'Technical Support', level: 1 },
  ];
}

export function org2Employees() {
  return [
    { name: 'Alex Chen', email: 'alex@tech.demo', phone: '+86-13900100001', position: 'CEO', role: 'admin', employee_number: 'T-EMP001' },
    { name: 'Sarah Wang', email: 'sarah@tech.demo', phone: '+86-13900100002', position: 'Sales Director', role: 'sales_manager', employee_number: 'T-EMP002' },
    { name: 'Mike Liu', email: 'mike@tech.demo', phone: '+86-13900100003', position: 'Operations Manager', role: 'inventory_manager', employee_number: 'T-EMP003' },
    { name: 'Jenny Zhou', email: 'jenny@tech.demo', phone: '+86-13900100004', position: 'Finance Manager', role: 'finance_manager', employee_number: 'T-EMP004' },
    { name: 'David Li', email: 'david@tech.demo', phone: '+86-13900100005', position: 'Account Manager', role: 'viewer', employee_number: 'T-EMP005' },
    { name: 'Amy Xu', email: 'amy@tech.demo', phone: '+86-13900100006', position: 'Logistics Coordinator', role: 'viewer', employee_number: 'T-EMP006' },
    { name: 'Tom Zhang', email: 'tom@tech.demo', phone: '+86-13900100007', position: 'Technical Lead', role: 'viewer', employee_number: 'T-EMP007' },
    { name: 'Lisa Huang', email: 'lisa@tech.demo', phone: '+86-13900100008', position: 'Accountant', role: 'viewer', employee_number: 'T-EMP008' },
  ];
}

export function org2ProductCategories() {
  return [
    { code: 'COMP', name: 'Components', level: 1 },
    { code: 'SYS', name: 'Systems', level: 1 },
    { code: 'ACC', name: 'Accessories', level: 1 },
  ];
}

export function org2TaxCodes() {
  return [
    { code: 'VAT13', name: 'VAT 13%', rate: 13, tax_type: 'output' },
    { code: 'VAT0', name: 'Zero Rate', rate: 0, tax_type: 'output' },
    { code: 'INPUT13', name: 'Input VAT 13%', rate: 13, tax_type: 'input' },
  ];
}

export function org2Products(): Array<Record<string, unknown> & { _meta: ProductInfo }> {
  const products = [
    { code: 'TE-MCU-001', name: 'ARM Cortex M4 Module', type: 'material', cost_price: 45, list_price: 65, unit: 'PCS', safety_stock_days: 14, lead_time_days: 7 },
    { code: 'TE-PCB-001', name: '4-Layer PCB Board', type: 'material', cost_price: 12, list_price: 18, unit: 'PCS', safety_stock_days: 21, lead_time_days: 10 },
    { code: 'TE-SEN-001', name: 'IoT Sensor Kit', type: 'material', cost_price: 85, list_price: 120, unit: 'SET', safety_stock_days: 14, lead_time_days: 7 },
    { code: 'TE-PWR-001', name: 'DC Power Supply 24V', type: 'material', cost_price: 35, list_price: 52, unit: 'PCS', safety_stock_days: 7, lead_time_days: 5 },
    { code: 'TE-CAB-001', name: 'Industrial Cable Set', type: 'material', cost_price: 22, list_price: 35, unit: 'SET', safety_stock_days: 7, lead_time_days: 3 },
    { code: 'TE-CTL-001', name: 'PLC Controller Unit', type: 'finished_good', cost_price: 1200, list_price: 1800, unit: 'PCS', safety_stock_days: 14, lead_time_days: 14 },
    { code: 'TE-GTW-001', name: 'IoT Gateway Pro', type: 'finished_good', cost_price: 850, list_price: 1350, unit: 'PCS', safety_stock_days: 14, lead_time_days: 10 },
    { code: 'TE-DIS-001', name: 'Industrial Display 10"', type: 'finished_good', cost_price: 420, list_price: 680, unit: 'PCS', safety_stock_days: 7, lead_time_days: 7 },
    { code: 'TE-KIT-001', name: 'Smart Factory Starter Kit', type: 'finished_good', cost_price: 3500, list_price: 5200, unit: 'SET', safety_stock_days: 7, lead_time_days: 14 },
    { code: 'TE-ACC-001', name: 'Accessory Pack', type: 'consumable', cost_price: 15, list_price: 28, unit: 'SET', safety_stock_days: 30, lead_time_days: 3 },
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
    { code: 'TC01', name: 'Shenzhen Smart Systems', customer_type: 'enterprise', classification: 'key', email: 'order@sz-smart.com', phone: '0755-88001234', credit_limit: 2000000, payment_terms: 30, default_currency: 'CNY', contact_name: '李明', contact_phone: '13900200001' },
    { code: 'TC02', name: 'Samsung Electronics Vietnam', customer_type: 'enterprise', classification: 'vip', email: 'proc@samsung-vn.com', phone: '+84-28-3824-1234', credit_limit: 800000, payment_terms: 60, default_currency: 'USD', contact_name: 'Nguyen', contact_phone: '+84-90-123-4567' },
    { code: 'TC03', name: 'Foxconn Industrial IoT', customer_type: 'enterprise', classification: 'vip', email: 'iot@foxconn.com', phone: '0755-27001234', credit_limit: 5000000, payment_terms: 45, default_currency: 'CNY', contact_name: '陈工', contact_phone: '13900200003' },
    { code: 'TC04', name: 'Siemens Asia Pacific', customer_type: 'enterprise', classification: 'key', email: 'apac@siemens.com', phone: '+65-6490-1234', credit_limit: 1000000, payment_terms: 60, default_currency: 'USD', contact_name: 'Mueller', contact_phone: '+65-9100-1234' },
    { code: 'TC05', name: 'BYD Electronic', customer_type: 'enterprise', classification: 'key', email: 'elec@byd.com', phone: '0755-89001234', credit_limit: 3000000, payment_terms: 30, default_currency: 'CNY', contact_name: '王工', contact_phone: '13900200005' },
    { code: 'TC06', name: 'Mitsubishi Electric', customer_type: 'enterprise', classification: 'standard', email: 'order@mitsubishi-e.jp', phone: '+81-3-3218-1234', credit_limit: 500000, payment_terms: 60, default_currency: 'USD', contact_name: 'Suzuki', contact_phone: '+81-90-8765-4321' },
    { code: 'TC07', name: 'Haier Smart Home', customer_type: 'enterprise', classification: 'standard', email: 'smart@haier.com', phone: '0532-88001234', credit_limit: 1500000, payment_terms: 30, default_currency: 'CNY', contact_name: '张经理', contact_phone: '13900200007' },
    { code: 'TC08', name: 'Bosch Connected Industry', customer_type: 'enterprise', classification: 'standard', email: 'ci@bosch.com', phone: '+49-711-811-1234', credit_limit: 600000, payment_terms: 60, default_currency: 'USD', contact_name: 'Schmidt', contact_phone: '+49-170-123-4567' },
  ];
}

export function org2Suppliers() {
  return [
    { code: 'TS01', name: 'Texas Instruments China', supplier_type: 'material', email: 'sales@ti-china.com', phone: '021-23073000', currency: 'USD', payment_terms: 45, lead_time_days: 14, reliability_score: 0.96, contact_name: '赵经理', contact_phone: '13800300001' },
    { code: 'TS02', name: 'Shenzhen PCB Factory', supplier_type: 'material', email: 'order@sz-pcb.com', phone: '0755-26001234', currency: 'CNY', payment_terms: 30, lead_time_days: 10, reliability_score: 0.90, contact_name: '周工', contact_phone: '13800300002' },
    { code: 'TS03', name: 'Mouser Electronics', supplier_type: 'material', email: 'asia@mouser.com', phone: '+1-817-804-3800', currency: 'USD', payment_terms: 30, lead_time_days: 7, reliability_score: 0.94, contact_name: 'Johnson', contact_phone: '+1-817-804-3801' },
    { code: 'TS04', name: 'DHL Express', supplier_type: 'logistics', email: 'cn-biz@dhl.com', phone: '400-810-8000', currency: 'CNY', payment_terms: 30, lead_time_days: 3, reliability_score: 0.93, contact_name: '物流顾问', contact_phone: '400-810-8001' },
    { code: 'TS05', name: 'Nanjing Assembly Services', supplier_type: 'subcontractor', email: 'biz@nj-assembly.com', phone: '025-86001234', currency: 'CNY', payment_terms: 30, lead_time_days: 14, reliability_score: 0.88, contact_name: '吴总', contact_phone: '13800300005' },
  ];
}

export function org2Warehouses() {
  return [
    { code: 'TW-MAIN', name: 'Main Warehouse', location: 'Shenzhen, China', warehouse_type: 'standard', capacity_volume: 2000, capacity_weight: 80000, status: 'active' },
    { code: 'TW-SHIP', name: 'Shipping Hub', location: 'Hong Kong SAR', warehouse_type: 'bonded', capacity_volume: 1000, capacity_weight: 30000, status: 'active' },
  ];
}

export function org2Carriers() {
  return [
    { code: 'TC-DHL', name: 'DHL Express', carrier_type: 'express', tracking_url_template: 'https://www.dhl.com/en/express/tracking.html?AWB={tracking_number}', is_active: true },
    { code: 'TC-FEDEX', name: 'FedEx International', carrier_type: 'express', tracking_url_template: 'https://www.fedex.com/fedextrack/?trknbr={tracking_number}', is_active: true },
    { code: 'TC-SF', name: 'SF Express', carrier_type: 'express', tracking_url_template: 'https://www.sf-express.com/cn/en/dynamic_function/waybill/#search/bill-number/{tracking_number}', is_active: true },
  ];
}

export function org2AccountSubjects() {
  return [
    { code: '1001', name: 'Cash', category: 'asset', balance_direction: 'debit', level: 1, is_leaf: true, is_active: true },
    { code: '1002', name: 'Bank Deposits', category: 'asset', balance_direction: 'debit', level: 1, is_leaf: true, is_active: true },
    { code: '1122', name: 'Accounts Receivable', category: 'asset', balance_direction: 'debit', level: 1, is_leaf: true, is_active: true },
    { code: '1401', name: 'Inventory', category: 'asset', balance_direction: 'debit', level: 1, is_leaf: true, is_active: true },
    { code: '1601', name: 'Fixed Assets', category: 'asset', balance_direction: 'debit', level: 1, is_leaf: true, is_active: true },
    { code: '2202', name: 'Accounts Payable', category: 'liability', balance_direction: 'credit', level: 1, is_leaf: true, is_active: true },
    { code: '2221', name: 'Tax Payable', category: 'liability', balance_direction: 'credit', level: 1, is_leaf: true, is_active: true },
    { code: '4001', name: 'Paid-in Capital', category: 'equity', balance_direction: 'credit', level: 1, is_leaf: true, is_active: true },
    { code: '4103', name: 'Current Year Profit', category: 'equity', balance_direction: 'credit', level: 1, is_leaf: true, is_active: true },
    { code: '6001', name: 'Sales Revenue', category: 'revenue', balance_direction: 'credit', level: 1, is_leaf: true, is_active: true },
    { code: '6401', name: 'Cost of Goods Sold', category: 'expense', balance_direction: 'debit', level: 1, is_leaf: true, is_active: true },
    { code: '6601', name: 'Selling Expenses', category: 'expense', balance_direction: 'debit', level: 1, is_leaf: true, is_active: true },
    { code: '6602', name: 'G&A Expenses', category: 'expense', balance_direction: 'debit', level: 1, is_leaf: true, is_active: true },
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

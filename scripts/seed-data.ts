#!/usr/bin/env node
// scripts/seed-data.ts
// Generate rich demo data for 2 organizations spanning 6 months of business history.
// Usage: npx tsx scripts/seed-data.ts --api-url http://localhost:8787 --token <admin-jwt>
//
// This script calls POST /api/admin/import-batch to load data through the API,
// ensuring all validation, audit trails, and business rules are applied.

const API_URL = process.argv.includes('--api-url')
  ? process.argv[process.argv.indexOf('--api-url') + 1]
  : 'http://localhost:8787';

const TOKEN = process.argv.includes('--token')
  ? process.argv[process.argv.indexOf('--token') + 1]
  : process.env.ADMIN_TOKEN;

const DRY_RUN = process.argv.includes('--dry-run');

if (!TOKEN) {
  console.error('Usage: npx tsx scripts/seed-data.ts --api-url <url> --token <admin-jwt> [--dry-run]');
  console.error('  Or set ADMIN_TOKEN env var');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function randomDate(start: Date, end: Date): string {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString().split('T')[0];
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function randomAmount(min: number, max: number, decimals = 2): number {
  return +(min + Math.random() * (max - min)).toFixed(decimals);
}

function monthsAgo(n: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
}

// ---------------------------------------------------------------------------
// Data generators
// ---------------------------------------------------------------------------

function generateDepartments() {
  return [
    { code: 'MGMT', name: '总经理办公室', level: 1 },
    { code: 'FIN', name: '财务部', level: 1 },
    { code: 'SALES', name: '销售部', level: 1 },
    { code: 'PROC', name: '采购部', level: 1 },
    { code: 'WH', name: '仓储物流部', level: 1 },
    { code: 'PROD', name: '生产部', level: 1 },
    { code: 'QC', name: '质量管理部', level: 1 },
    { code: 'RD', name: '研发部', level: 1 },
  ];
}

function generateEmployees() {
  const employees = [
    { name: '张伟', email: 'zhangwei@demo.com', phone: '13800001001', position: '总经理', role: 'admin', employee_number: 'EMP001', department_code: 'MGMT' },
    { name: '李娜', email: 'lina@demo.com', phone: '13800001002', position: '财务总监', role: 'finance_manager', employee_number: 'EMP002', department_code: 'FIN' },
    { name: '王强', email: 'wangqiang@demo.com', phone: '13800001003', position: '销售经理', role: 'sales_manager', employee_number: 'EMP003', department_code: 'SALES' },
    { name: '赵敏', email: 'zhaomin@demo.com', phone: '13800001004', position: '采购经理', role: 'procurement_manager', employee_number: 'EMP004', department_code: 'PROC' },
    { name: '陈刚', email: 'chengang@demo.com', phone: '13800001005', position: '仓库主管', role: 'inventory_manager', employee_number: 'EMP005', department_code: 'WH' },
    { name: '刘洋', email: 'liuyang@demo.com', phone: '13800001006', position: '生产主管', role: 'production_manager', employee_number: 'EMP006', department_code: 'PROD' },
    { name: '孙丽', email: 'sunli@demo.com', phone: '13800001007', position: '质检主管', role: 'quality_manager', employee_number: 'EMP007', department_code: 'QC' },
    { name: '周磊', email: 'zhoulei@demo.com', phone: '13800001008', position: '销售代表', role: 'viewer', employee_number: 'EMP008', department_code: 'SALES' },
    { name: '吴芳', email: 'wufang@demo.com', phone: '13800001009', position: '会计', role: 'viewer', employee_number: 'EMP009', department_code: 'FIN' },
    { name: '郑浩', email: 'zhenghao@demo.com', phone: '13800001010', position: '采购专员', role: 'viewer', employee_number: 'EMP010', department_code: 'PROC' },
  ];
  return employees.map(({ department_code, ...rest }) => rest);
}

function generateProductCategories() {
  return [
    { code: 'RAW', name: '原材料', level: 1 },
    { code: 'SEMI', name: '半成品', level: 1 },
    { code: 'FIN', name: '成品', level: 1 },
    { code: 'PACK', name: '包装材料', level: 1 },
    { code: 'CONS', name: '办公耗材', level: 1 },
  ];
}

function generateProducts(categoryIds: Record<string, string>) {
  const products = [
    // Raw materials
    { code: 'RM-AL-001', name: '铝合金板材 6061-T6', type: 'material', category_code: 'RAW', cost_price: 45.00, list_price: 52.00, unit: 'KG', safety_stock_days: 14, lead_time_days: 7 },
    { code: 'RM-AL-002', name: '铝合金棒材 7075', type: 'material', category_code: 'RAW', cost_price: 68.50, list_price: 78.00, unit: 'KG', safety_stock_days: 14, lead_time_days: 10 },
    { code: 'RM-ST-001', name: '不锈钢管 304', type: 'material', category_code: 'RAW', cost_price: 32.00, list_price: 38.00, unit: 'M', safety_stock_days: 7, lead_time_days: 5 },
    { code: 'RM-ST-002', name: '不锈钢板 316L', type: 'material', category_code: 'RAW', cost_price: 85.00, list_price: 95.00, unit: 'KG', safety_stock_days: 14, lead_time_days: 10 },
    { code: 'RM-CU-001', name: '紫铜排', type: 'material', category_code: 'RAW', cost_price: 58.00, list_price: 65.00, unit: 'KG', safety_stock_days: 7, lead_time_days: 5 },
    { code: 'RM-PL-001', name: 'PA66 尼龙粒子', type: 'material', category_code: 'RAW', cost_price: 22.00, list_price: 28.00, unit: 'KG', safety_stock_days: 21, lead_time_days: 14 },
    { code: 'RM-RB-001', name: 'NBR 密封橡胶', type: 'material', category_code: 'RAW', cost_price: 120.00, list_price: 145.00, unit: 'KG', safety_stock_days: 30, lead_time_days: 21 },
    { code: 'RM-EL-001', name: '电子元器件套装 A', type: 'material', category_code: 'RAW', cost_price: 15.50, list_price: 22.00, unit: 'SET', safety_stock_days: 14, lead_time_days: 7 },
    // Semi-finished
    { code: 'SF-FR-001', name: '铝合金框架组件', type: 'semi_finished', category_code: 'SEMI', cost_price: 180.00, list_price: 220.00, unit: 'PCS', safety_stock_days: 7, lead_time_days: 3 },
    { code: 'SF-SH-001', name: '不锈钢壳体', type: 'semi_finished', category_code: 'SEMI', cost_price: 95.00, list_price: 120.00, unit: 'PCS', safety_stock_days: 7, lead_time_days: 3 },
    { code: 'SF-PCB-001', name: 'PCB 控制板', type: 'semi_finished', category_code: 'SEMI', cost_price: 45.00, list_price: 65.00, unit: 'PCS', safety_stock_days: 14, lead_time_days: 5 },
    // Finished goods
    { code: 'FG-VLV-001', name: '工业电磁阀 DN25', type: 'finished_good', category_code: 'FIN', cost_price: 380.00, list_price: 520.00, unit: 'PCS', safety_stock_days: 14, lead_time_days: 7 },
    { code: 'FG-VLV-002', name: '工业电磁阀 DN50', type: 'finished_good', category_code: 'FIN', cost_price: 560.00, list_price: 780.00, unit: 'PCS', safety_stock_days: 14, lead_time_days: 7 },
    { code: 'FG-PMP-001', name: '离心泵 CYZ-50', type: 'finished_good', category_code: 'FIN', cost_price: 2800.00, list_price: 3800.00, unit: 'PCS', safety_stock_days: 7, lead_time_days: 14 },
    { code: 'FG-PMP-002', name: '自吸泵 ZW-80', type: 'finished_good', category_code: 'FIN', cost_price: 4200.00, list_price: 5600.00, unit: 'PCS', safety_stock_days: 7, lead_time_days: 14 },
    { code: 'FG-FLT-001', name: '精密过滤器 PF-100', type: 'finished_good', category_code: 'FIN', cost_price: 1500.00, list_price: 2100.00, unit: 'PCS', safety_stock_days: 7, lead_time_days: 10 },
    { code: 'FG-ACT-001', name: '气动执行器 AT-40', type: 'finished_good', category_code: 'FIN', cost_price: 850.00, list_price: 1200.00, unit: 'PCS', safety_stock_days: 7, lead_time_days: 7 },
    { code: 'FG-SNS-001', name: '压力传感器 PT-100', type: 'finished_good', category_code: 'FIN', cost_price: 320.00, list_price: 450.00, unit: 'PCS', safety_stock_days: 14, lead_time_days: 5 },
    // Packaging
    { code: 'PK-BOX-001', name: '标准纸箱 60×40×30', type: 'consumable', category_code: 'PACK', cost_price: 8.50, list_price: 12.00, unit: 'PCS', safety_stock_days: 30, lead_time_days: 3 },
    { code: 'PK-PLT-001', name: '木质托盘 1200×1000', type: 'consumable', category_code: 'PACK', cost_price: 65.00, list_price: 85.00, unit: 'PCS', safety_stock_days: 14, lead_time_days: 5 },
  ];
  return products.map(({ category_code, ...rest }) => rest);
}

function generateCustomers() {
  return [
    { code: 'C001', name: '上海华能电力集团', customer_type: 'enterprise', classification: 'vip', email: 'purchase@huaneng-sh.com', phone: '021-58001001', credit_limit: 5000000, payment_terms: 60, default_currency: 'CNY', contact_name: '王经理', contact_phone: '13900001001' },
    { code: 'C002', name: '中国石化上海分公司', customer_type: 'enterprise', classification: 'vip', email: 'proc@sinopec-sh.com', phone: '021-58002002', credit_limit: 10000000, payment_terms: 45, default_currency: 'CNY', contact_name: '李总', contact_phone: '13900001002' },
    { code: 'C003', name: '宝山钢铁股份有限公司', customer_type: 'enterprise', classification: 'key', email: 'supply@baosteel.com', phone: '021-26641234', credit_limit: 8000000, payment_terms: 45, default_currency: 'CNY', contact_name: '张采购', contact_phone: '13900001003' },
    { code: 'C004', name: '江苏恒力石化', customer_type: 'enterprise', classification: 'key', email: 'order@hengli.com', phone: '0512-87001234', credit_limit: 3000000, payment_terms: 30, default_currency: 'CNY', contact_name: '赵经理', contact_phone: '13900001004' },
    { code: 'C005', name: '广州白云山制药', customer_type: 'enterprise', classification: 'standard', email: 'purchase@baiyunshan.com', phone: '020-83001234', credit_limit: 2000000, payment_terms: 30, default_currency: 'CNY', contact_name: '陈主任', contact_phone: '13900001005' },
    { code: 'C006', name: '天津港保税区物流', customer_type: 'enterprise', classification: 'standard', email: 'logistics@tjport.com', phone: '022-65001234', credit_limit: 1500000, payment_terms: 30, default_currency: 'CNY', contact_name: '刘工', contact_phone: '13900001006' },
    { code: 'C007', name: '杭州汇能环保科技', customer_type: 'enterprise', classification: 'standard', email: 'tech@huineng.com', phone: '0571-88001234', credit_limit: 1000000, payment_terms: 30, default_currency: 'CNY', contact_name: '孙总', contact_phone: '13900001007' },
    { code: 'C008', name: '成都新希望化工', customer_type: 'enterprise', classification: 'standard', email: 'order@xinhope.com', phone: '028-86001234', credit_limit: 800000, payment_terms: 30, default_currency: 'CNY', contact_name: '吴经理', contact_phone: '13900001008' },
    { code: 'C009', name: '武汉东湖水处理', customer_type: 'enterprise', classification: 'occasional', email: 'buy@donghu-water.com', phone: '027-87001234', credit_limit: 500000, payment_terms: 30, default_currency: 'CNY', contact_name: '周主管', contact_phone: '13900001009' },
    { code: 'C010', name: '深圳鹏程电子', customer_type: 'enterprise', classification: 'occasional', email: 'sales@pengcheng.com', phone: '0755-26001234', credit_limit: 300000, payment_terms: 15, default_currency: 'CNY', contact_name: '郑经理', contact_phone: '13900001010' },
    { code: 'C011', name: '南京扬子石化', customer_type: 'enterprise', classification: 'key', email: 'purchase@ypc.com', phone: '025-57001234', credit_limit: 6000000, payment_terms: 45, default_currency: 'CNY', contact_name: '马总', contact_phone: '13900001011' },
    { code: 'C012', name: '青岛海信集团', customer_type: 'enterprise', classification: 'key', email: 'proc@hisense.com', phone: '0532-83001234', credit_limit: 4000000, payment_terms: 30, default_currency: 'CNY', contact_name: '黄经理', contact_phone: '13900001012' },
    { code: 'C013', name: 'Pacific Engineering Ltd', customer_type: 'enterprise', classification: 'standard', email: 'order@pacific-eng.com', phone: '+65-6001-1234', credit_limit: 500000, payment_terms: 60, default_currency: 'USD', contact_name: 'John Lee', contact_phone: '+65-9001-1234' },
    { code: 'C014', name: 'Nippon Valve Corporation', customer_type: 'enterprise', classification: 'standard', email: 'sales@nippon-valve.co.jp', phone: '+81-3-1234-5678', credit_limit: 300000, payment_terms: 60, default_currency: 'USD', contact_name: 'Tanaka', contact_phone: '+81-90-1234-5678' },
    { code: 'C015', name: '重庆长安工业', customer_type: 'enterprise', classification: 'standard', email: 'buy@changan-ind.com', phone: '023-68001234', credit_limit: 1200000, payment_terms: 30, default_currency: 'CNY', contact_name: '何经理', contact_phone: '13900001015' },
  ];
}

function generateSuppliers() {
  return [
    { code: 'S001', name: '宁波永信铝业', supplier_type: 'material', email: 'sales@yongxin-al.com', phone: '0574-87001234', currency: 'CNY', payment_terms: 30, lead_time_days: 7, reliability_score: 0.95, contact_name: '钱总', contact_phone: '13800002001' },
    { code: 'S002', name: '太钢不锈钢经销', supplier_type: 'material', email: 'order@tisco-dealer.com', phone: '0351-42001234', currency: 'CNY', payment_terms: 45, lead_time_days: 10, reliability_score: 0.92, contact_name: '韩经理', contact_phone: '13800002002' },
    { code: 'S003', name: '昆山精密铸造', supplier_type: 'subcontractor', email: 'biz@ks-casting.com', phone: '0512-57001234', currency: 'CNY', payment_terms: 30, lead_time_days: 14, reliability_score: 0.88, contact_name: '朱总', contact_phone: '13800002003' },
    { code: 'S004', name: '广东华南橡塑', supplier_type: 'material', email: 'supply@hn-rubber.com', phone: '0769-22001234', currency: 'CNY', payment_terms: 30, lead_time_days: 7, reliability_score: 0.90, contact_name: '唐经理', contact_phone: '13800002004' },
    { code: 'S005', name: '深圳兴华电子', supplier_type: 'material', email: 'components@xh-elec.com', phone: '0755-86001234', currency: 'CNY', payment_terms: 15, lead_time_days: 5, reliability_score: 0.93, contact_name: '冯工', contact_phone: '13800002005' },
    { code: 'S006', name: '河北邯郸铜材', supplier_type: 'material', email: 'sales@hd-copper.com', phone: '0310-31001234', currency: 'CNY', payment_terms: 30, lead_time_days: 10, reliability_score: 0.87, contact_name: '曹经理', contact_phone: '13800002006' },
    { code: 'S007', name: '苏州工业包装', supplier_type: 'material', email: 'pack@sz-package.com', phone: '0512-65001234', currency: 'CNY', payment_terms: 15, lead_time_days: 3, reliability_score: 0.96, contact_name: '蒋主管', contact_phone: '13800002007' },
    { code: 'S008', name: '上海申通快递物流', supplier_type: 'logistics', email: 'biz@sto-logistics.com', phone: '021-39001234', currency: 'CNY', payment_terms: 30, lead_time_days: 2, reliability_score: 0.91, contact_name: '沈经理', contact_phone: '13800002008' },
    { code: 'S009', name: 'Osaka Metal Trading', supplier_type: 'material', email: 'trade@osaka-metal.jp', phone: '+81-6-1234-5678', currency: 'USD', payment_terms: 60, lead_time_days: 21, reliability_score: 0.94, contact_name: 'Yamada', contact_phone: '+81-90-5678-1234' },
    { code: 'S010', name: '巴斯夫化工（中国）', supplier_type: 'material', email: 'china@basf.com', phone: '021-20001234', currency: 'CNY', payment_terms: 45, lead_time_days: 14, reliability_score: 0.97, contact_name: '林经理', contact_phone: '13800002010' },
  ];
}

function generateWarehouses() {
  return [
    { code: 'WH-MAIN', name: '主仓库', location: '上海市嘉定区曹安公路1234号', warehouse_type: 'standard', capacity_volume: 5000, capacity_weight: 200000, status: 'active' },
    { code: 'WH-RAW', name: '原材料仓库', location: '上海市嘉定区曹安公路1234号-B区', warehouse_type: 'standard', capacity_volume: 3000, capacity_weight: 150000, status: 'active' },
    { code: 'WH-FIN', name: '成品仓库', location: '上海市嘉定区曹安公路1234号-C区', warehouse_type: 'standard', capacity_volume: 4000, capacity_weight: 100000, status: 'active' },
  ];
}

function generateCarriers() {
  return [
    { code: 'CR-SF', name: '顺丰速运', carrier_type: 'express', tracking_url_template: 'https://www.sf-express.com/cn/sc/dynamic_function/waybill/#search/bill-number/{tracking_number}', is_active: true },
    { code: 'CR-JD', name: '京东物流', carrier_type: 'express', tracking_url_template: 'https://www.jdl.com/track?waybillCode={tracking_number}', is_active: true },
    { code: 'CR-DB', name: '德邦快递', carrier_type: 'freight', tracking_url_template: 'https://www.deppon.com/tracking?orderNo={tracking_number}', is_active: true },
    { code: 'CR-ZT', name: '中通快递', carrier_type: 'express', tracking_url_template: 'https://www.zto.com/express/expressSearch.html?billCode={tracking_number}', is_active: true },
    { code: 'CR-COSCO', name: '中远海运', carrier_type: 'ocean', tracking_url_template: 'https://elines.coscoshipping.com/ebtracking/public/containers/{tracking_number}', is_active: true },
  ];
}

function generateAccountSubjects() {
  return [
    // Assets
    { code: '1001', name: '库存现金', category: 'asset', balance_direction: 'debit', level: 1, is_leaf: true, is_active: true },
    { code: '1002', name: '银行存款', category: 'asset', balance_direction: 'debit', level: 1, is_leaf: true, is_active: true },
    { code: '1122', name: '应收账款', category: 'asset', balance_direction: 'debit', level: 1, is_leaf: true, is_active: true },
    { code: '1221', name: '其他应收款', category: 'asset', balance_direction: 'debit', level: 1, is_leaf: true, is_active: true },
    { code: '1401', name: '原材料', category: 'asset', balance_direction: 'debit', level: 1, is_leaf: true, is_active: true },
    { code: '1405', name: '库存商品', category: 'asset', balance_direction: 'debit', level: 1, is_leaf: true, is_active: true },
    { code: '1601', name: '固定资产', category: 'asset', balance_direction: 'debit', level: 1, is_leaf: true, is_active: true },
    { code: '1602', name: '累计折旧', category: 'asset', balance_direction: 'credit', level: 1, is_leaf: true, is_active: true },
    // Liabilities
    { code: '2202', name: '应付账款', category: 'liability', balance_direction: 'credit', level: 1, is_leaf: true, is_active: true },
    { code: '2211', name: '应付职工薪酬', category: 'liability', balance_direction: 'credit', level: 1, is_leaf: true, is_active: true },
    { code: '2221', name: '应交税费', category: 'liability', balance_direction: 'credit', level: 1, is_leaf: true, is_active: true },
    { code: '2241', name: '其他应付款', category: 'liability', balance_direction: 'credit', level: 1, is_leaf: true, is_active: true },
    // Equity
    { code: '4001', name: '实收资本', category: 'equity', balance_direction: 'credit', level: 1, is_leaf: true, is_active: true },
    { code: '4101', name: '盈余公积', category: 'equity', balance_direction: 'credit', level: 1, is_leaf: true, is_active: true },
    { code: '4103', name: '本年利润', category: 'equity', balance_direction: 'credit', level: 1, is_leaf: true, is_active: true },
    { code: '4104', name: '利润分配', category: 'equity', balance_direction: 'credit', level: 1, is_leaf: true, is_active: true },
    // Revenue
    { code: '6001', name: '主营业务收入', category: 'revenue', balance_direction: 'credit', level: 1, is_leaf: true, is_active: true },
    { code: '6051', name: '其他业务收入', category: 'revenue', balance_direction: 'credit', level: 1, is_leaf: true, is_active: true },
    // Expenses
    { code: '6401', name: '主营业务成本', category: 'expense', balance_direction: 'debit', level: 1, is_leaf: true, is_active: true },
    { code: '6402', name: '其他业务成本', category: 'expense', balance_direction: 'debit', level: 1, is_leaf: true, is_active: true },
    { code: '6601', name: '销售费用', category: 'expense', balance_direction: 'debit', level: 1, is_leaf: true, is_active: true },
    { code: '6602', name: '管理费用', category: 'expense', balance_direction: 'debit', level: 1, is_leaf: true, is_active: true },
    { code: '6603', name: '财务费用', category: 'expense', balance_direction: 'debit', level: 1, is_leaf: true, is_active: true },
    { code: '6711', name: '营业外支出', category: 'expense', balance_direction: 'debit', level: 1, is_leaf: true, is_active: true },
  ];
}

function generateCostCenters() {
  return [
    { code: 'CC-MGMT', name: '管理中心' },
    { code: 'CC-SALES', name: '销售中心' },
    { code: 'CC-PROD', name: '生产中心' },
    { code: 'CC-RD', name: '研发中心' },
  ];
}

function generateDefectCodes() {
  return [
    { code: 'D001', name: '尺寸超差', category: 'process', severity: 'major', description: '产品尺寸超出公差范围', corrective_action: '调整加工参数，重新校准设备', is_active: true },
    { code: 'D002', name: '表面划伤', category: 'process', severity: 'minor', description: '产品表面有明显划痕', corrective_action: '改善搬运流程，增加防护包装', is_active: true },
    { code: 'D003', name: '材料缺陷', category: 'material', severity: 'critical', description: '原材料内部缺陷（夹渣、气孔等）', corrective_action: '加强来料检验，更换供应商批次', is_active: true },
    { code: 'D004', name: '装配不良', category: 'human', severity: 'major', description: '部件装配不到位或错装', corrective_action: '强化操作培训，增加检查工序', is_active: true },
    { code: 'D005', name: '焊接缺陷', category: 'process', severity: 'critical', description: '焊缝气孔、裂纹、虚焊等', corrective_action: '检查焊接参数，重新培训焊工', is_active: true },
    { code: 'D006', name: '涂层脱落', category: 'process', severity: 'minor', description: '表面涂层附着力不足', corrective_action: '检查前处理工艺，调整涂层配方', is_active: true },
  ];
}

// ---------------------------------------------------------------------------
// Business document generators (6 months of history)
// ---------------------------------------------------------------------------

interface SeedContext {
  products: Array<{ code: string; cost_price: number; list_price: number; type: string }>;
  customers: Array<{ code: string }>;
  suppliers: Array<{ code: string }>;
  warehouses: Array<{ code: string }>;
}

function generatePurchaseOrders(ctx: SeedContext): Array<Record<string, unknown>> {
  const orders: Array<Record<string, unknown>> = [];
  const rawMaterials = ctx.products.filter((p) => p.type === 'material' || p.type === 'consumable');
  const statuses = ['draft', 'submitted', 'approved', 'received', 'closed'];

  for (let month = 5; month >= 0; month--) {
    const count = 8 + Math.floor(Math.random() * 5); // 8-12 per month
    for (let i = 0; i < count; i++) {
      const supplier = pick(ctx.suppliers);
      const warehouse = pick(ctx.warehouses);
      const orderDate = randomDate(monthsAgo(month + 1), monthsAgo(month));
      const itemCount = 1 + Math.floor(Math.random() * 4);
      const items = pickN(rawMaterials, itemCount).map((prod, idx) => ({
        product_code: prod.code,
        qty: (5 + Math.floor(Math.random() * 95)) * 10,
        unit_price: prod.cost_price * (0.95 + Math.random() * 0.1),
        tax_rate: 13,
        line_number: idx + 1,
      }));

      orders.push({
        supplier_code: supplier.code,
        warehouse_code: warehouse.code,
        order_date: orderDate,
        expected_date: randomDate(new Date(orderDate), monthsAgo(Math.max(0, month - 1))),
        currency: 'CNY',
        payment_terms: pick([15, 30, 45, 60]),
        status: month >= 2 ? pick(statuses.slice(2)) : pick(statuses),
        items,
      });
    }
  }
  return orders;
}

function generateSalesOrders(ctx: SeedContext): Array<Record<string, unknown>> {
  const orders: Array<Record<string, unknown>> = [];
  const finishedGoods = ctx.products.filter((p) => p.type === 'finished_good');
  const statuses = ['draft', 'confirmed', 'approved', 'shipped', 'completed'];

  for (let month = 5; month >= 0; month--) {
    const count = 10 + Math.floor(Math.random() * 8); // 10-17 per month
    for (let i = 0; i < count; i++) {
      const customer = pick(ctx.customers);
      const warehouse = pick(ctx.warehouses);
      const orderDate = randomDate(monthsAgo(month + 1), monthsAgo(month));
      const itemCount = 1 + Math.floor(Math.random() * 3);
      const items = pickN(finishedGoods, itemCount).map((prod, idx) => ({
        product_code: prod.code,
        qty: 1 + Math.floor(Math.random() * 20),
        unit_price: prod.list_price * (0.9 + Math.random() * 0.15),
        tax_rate: 13,
        discount_rate: pick([0, 0, 0, 5, 10, 15]),
        line_number: idx + 1,
      }));

      orders.push({
        customer_code: customer.code,
        warehouse_code: warehouse.code,
        order_date: orderDate,
        delivery_date: randomDate(new Date(orderDate), monthsAgo(Math.max(0, month - 1))),
        currency: customer.code === 'C013' || customer.code === 'C014' ? 'USD' : 'CNY',
        payment_terms: pick([15, 30, 45, 60]),
        status: month >= 2 ? pick(statuses.slice(2)) : pick(statuses),
        items,
      });
    }
  }
  return orders;
}

function generateStockRecords(ctx: SeedContext): Array<Record<string, unknown>> {
  const records: Array<Record<string, unknown>> = [];
  for (const warehouse of ctx.warehouses) {
    for (const product of ctx.products) {
      const qty = product.type === 'material'
        ? 500 + Math.floor(Math.random() * 2000)
        : product.type === 'finished_good'
          ? 20 + Math.floor(Math.random() * 100)
          : 50 + Math.floor(Math.random() * 200);
      const reserved = Math.floor(qty * Math.random() * 0.2);
      records.push({
        warehouse_code: warehouse.code,
        product_code: product.code,
        qty_on_hand: qty,
        qty_reserved: reserved,
      });
    }
  }
  return records;
}

// ---------------------------------------------------------------------------
// API call wrapper
// ---------------------------------------------------------------------------

async function callImportBatch(
  data: Record<string, Record<string, unknown>[]>,
  options: { upsert?: boolean; dry_run?: boolean; on_error?: string } = {}
): Promise<any> {
  const url = `${API_URL}/api/admin/import-batch`;
  console.log(`\n  Importing batch: ${Object.keys(data).map((k) => `${k}(${data[k].length})`).join(', ')}`);

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ data, options: { ...options, dry_run: DRY_RUN } }),
  });

  const json = await resp.json() as any;
  if (!resp.ok && resp.status !== 207) {
    console.error(`  ERROR ${resp.status}:`, json.detail ?? json.error ?? JSON.stringify(json));
    return null;
  }

  // Print summary
  if (json.data?.results) {
    for (const r of json.data.results) {
      const status = r.errors.length > 0 ? '⚠' : '✓';
      console.log(`  ${status} ${r.entity}: imported=${r.imported}, skipped=${r.skipped}, errors=${r.errors.length}`);
      for (const e of r.errors.slice(0, 3)) {
        console.log(`    row ${e.row}: ${e.message}${e.hint ? ` (hint: ${e.hint})` : ''}`);
      }
      if (r.errors.length > 3) console.log(`    ... and ${r.errors.length - 3} more errors`);
    }
  }
  return json;
}

async function callImportSingle(
  entity: string,
  records: Record<string, unknown>[],
  options: { upsert?: boolean; on_error?: string } = {}
): Promise<any> {
  const url = `${API_URL}/api/admin/import/${entity}`;
  console.log(`\n  Importing ${entity}: ${records.length} records`);

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ records, options: { ...options, dry_run: DRY_RUN } }),
  });

  const json = await resp.json() as any;
  if (!resp.ok && resp.status !== 207) {
    console.error(`  ERROR ${resp.status}:`, json.detail ?? json.error ?? JSON.stringify(json));
    return null;
  }

  const r = json.data;
  if (r) {
    const status = r.errors?.length > 0 ? '⚠' : '✓';
    console.log(`  ${status} ${r.entity}: imported=${r.imported}, skipped=${r.skipped}, errors=${r.errors?.length ?? 0}`);
    for (const e of (r.errors ?? []).slice(0, 5)) {
      console.log(`    row ${e.row}: ${e.message}${e.hint ? ` (hint: ${e.hint})` : ''}`);
    }
  }
  return json;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== ERP-Refine Seed Data Generator ===');
  console.log(`API: ${API_URL}`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (validation only)' : 'LIVE INSERT'}`);
  console.log('');

  // ---- Step 1: Foundation & Master Data ----
  console.log('--- Step 1: Foundation & Master Data ---');
  await callImportBatch({
    departments: generateDepartments(),
    'product-categories': generateProductCategories(),
    'account-subjects': generateAccountSubjects(),
    'cost-centers': generateCostCenters(),
    'defect-codes': generateDefectCodes(),
  }, { upsert: true });

  // ---- Step 2: Employees (after departments) ----
  console.log('\n--- Step 2: Employees ---');
  await callImportSingle('employees', generateEmployees(), { upsert: true });

  // ---- Step 3: Partners ----
  console.log('\n--- Step 3: Customers & Suppliers ---');
  await callImportBatch({
    customers: generateCustomers(),
    suppliers: generateSuppliers(),
  }, { upsert: true });

  // ---- Step 4: Warehouses & Carriers ----
  console.log('\n--- Step 4: Warehouses & Carriers ---');
  await callImportBatch({
    warehouses: generateWarehouses(),
    carriers: generateCarriers(),
  }, { upsert: true });

  // ---- Step 5: Products ----
  console.log('\n--- Step 5: Products ---');
  const products = generateProducts({});
  await callImportSingle('products', products, { upsert: true });

  // ---- Step 6: Opening Stock Balances ----
  console.log('\n--- Step 6: Opening Stock Balances ---');
  const seedCtx: SeedContext = {
    products: generateProducts({}).map((p: any) => ({
      code: p.code,
      cost_price: p.cost_price,
      list_price: p.list_price,
      type: p.type,
    })),
    customers: generateCustomers().map((c) => ({ code: c.code })),
    suppliers: generateSuppliers().map((s) => ({ code: s.code })),
    warehouses: generateWarehouses().map((w) => ({ code: w.code })),
  };
  const stockRecords = generateStockRecords(seedCtx);
  await callImportSingle('stock-records', stockRecords, { upsert: true });

  // ---- Step 7: Purchase Orders (6 months) ----
  console.log('\n--- Step 7: Purchase Orders (6 months) ---');
  const poData = generatePurchaseOrders(seedCtx);
  console.log(`  Generated ${poData.length} purchase orders`);
  // Import POs as flat records (items are embedded but import engine handles them as flat)
  // For POs we need to use the individual PO import which just inserts the header
  await callImportSingle('purchase-orders', poData.map(({ items, ...header }) => header), { on_error: 'skip' });

  // ---- Step 8: Sales Orders (6 months) ----
  console.log('\n--- Step 8: Sales Orders (6 months) ---');
  const soData = generateSalesOrders(seedCtx);
  console.log(`  Generated ${soData.length} sales orders`);
  await callImportSingle('sales-orders', soData.map(({ items, ...header }) => header), { on_error: 'skip' });

  // ---- Summary ----
  console.log('\n=== Seed Data Generation Complete ===');
  console.log(`Purchase Orders: ${poData.length}`);
  console.log(`Sales Orders: ${soData.length}`);
  console.log(`Products: ${products.length}`);
  console.log(`Stock Records: ${stockRecords.length}`);
  if (DRY_RUN) console.log('\n*** DRY RUN — no data was actually inserted ***');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

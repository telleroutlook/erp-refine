// scripts/seed/data/org1-master.ts
// Organization 1 (DEFAULT) — Industrial valve/pump manufacturer
// Master data generators

import type { ProductInfo } from '../types';

export function org1Departments() {
  return [
    { code: 'MGMT', name: '总经理办公室' },
    { code: 'FIN', name: '财务部' },
    { code: 'FIN-AP', name: '应付组', parent_code: 'FIN' },
    { code: 'FIN-AR', name: '应收组', parent_code: 'FIN' },
    { code: 'SALES', name: '销售部' },
    { code: 'SALES-DOM', name: '国内销售', parent_code: 'SALES' },
    { code: 'SALES-INT', name: '国际销售', parent_code: 'SALES' },
    { code: 'PROC', name: '采购部' },
    { code: 'WH', name: '仓储物流部' },
    { code: 'PROD', name: '生产部' },
    { code: 'QC', name: '质量管理部' },
    { code: 'RD', name: '研发部' },
  ];
}

export function org1Employees() {
  return [
    { name: '张伟', email: 'zhangwei@demo.com', phone: '13800001001', position: '总经理', employee_number: 'EMP001' },
    { name: '李娜', email: 'lina@demo.com', phone: '13800001002', position: '财务总监', employee_number: 'EMP002' },
    { name: '王强', email: 'wangqiang@demo.com', phone: '13800001003', position: '销售经理', employee_number: 'EMP003' },
    { name: '赵敏', email: 'zhaomin@demo.com', phone: '13800001004', position: '采购经理', employee_number: 'EMP004' },
    { name: '陈刚', email: 'chengang@demo.com', phone: '13800001005', position: '仓库主管', employee_number: 'EMP005' },
    { name: '刘洋', email: 'liuyang@demo.com', phone: '13800001006', position: '生产主管', employee_number: 'EMP006' },
    { name: '孙丽', email: 'sunli@demo.com', phone: '13800001007', position: '质检主管', employee_number: 'EMP007' },
    { name: '周磊', email: 'zhoulei@demo.com', phone: '13800001008', position: '国内销售代表', employee_number: 'EMP008' },
    { name: '吴芳', email: 'wufang@demo.com', phone: '13800001009', position: '应付会计', employee_number: 'EMP009' },
    { name: '郑浩', email: 'zhenghao@demo.com', phone: '13800001010', position: '采购专员', employee_number: 'EMP010' },
    { name: '黄薇', email: 'huangwei@demo.com', phone: '13800001011', position: '应收会计', employee_number: 'EMP011' },
    { name: '马腾', email: 'mateng@demo.com', phone: '13800001012', position: '外贸业务员', employee_number: 'EMP012' },
    { name: '许杰', email: 'xujie@demo.com', phone: '13800001013', position: '车间组长', employee_number: 'EMP013' },
    { name: '徐静', email: 'xujing@demo.com', phone: '13800001014', position: '质检员', employee_number: 'EMP014' },
    { name: '韩涛', email: 'hantao@demo.com', phone: '13800001015', position: '仓管员', employee_number: 'EMP015' },
    { name: '曹勇', email: 'caoyong@demo.com', phone: '13800001016', position: '研发工程师', employee_number: 'EMP016' },
    { name: '谢莉', email: 'xieli@demo.com', phone: '13800001017', position: '行政助理', employee_number: 'EMP017' },
    { name: '邓鹏', email: 'dengpeng@demo.com', phone: '13800001018', position: '设备技术员', employee_number: 'EMP018' },
  ];
}

export function org1ProductCategories() {
  return [
    { code: 'RAW', name: '原材料', level: 1 },
    { code: 'SEMI', name: '半成品', level: 1 },
    { code: 'FIN', name: '成品', level: 1 },
    { code: 'PACK', name: '包装材料', level: 1 },
    { code: 'CONS', name: '办公耗材', level: 1 },
  ];
}


/** Products with metadata needed by transaction generators */
export function org1Products(): Array<Record<string, unknown> & { _meta: ProductInfo }> {
  const products = [
    // Raw materials
    { code: 'RM-AL-001', name: '铝合金板材 6061-T6', type: 'material', cost_price: 45.00, sale_price: 52.00, list_price: 52.00, unit: 'KG', safety_stock_days: 14 },
    { code: 'RM-AL-002', name: '铝合金棒材 7075', type: 'material', cost_price: 68.50, sale_price: 78.00, list_price: 78.00, unit: 'KG', safety_stock_days: 14 },
    { code: 'RM-ST-001', name: '不锈钢管 304', type: 'material', cost_price: 32.00, sale_price: 38.00, list_price: 38.00, unit: 'M', safety_stock_days: 7 },
    { code: 'RM-ST-002', name: '不锈钢板 316L', type: 'material', cost_price: 85.00, sale_price: 95.00, list_price: 95.00, unit: 'KG', safety_stock_days: 14 },
    { code: 'RM-CU-001', name: '紫铜排', type: 'material', cost_price: 58.00, sale_price: 65.00, list_price: 65.00, unit: 'KG', safety_stock_days: 7 },
    { code: 'RM-PL-001', name: 'PA66 尼龙粒子', type: 'material', cost_price: 22.00, sale_price: 28.00, list_price: 28.00, unit: 'KG', safety_stock_days: 21 },
    { code: 'RM-RB-001', name: 'NBR 密封橡胶', type: 'material', cost_price: 120.00, sale_price: 145.00, list_price: 145.00, unit: 'KG', safety_stock_days: 30 },
    { code: 'RM-EL-001', name: '电子元器件套装 A', type: 'material', cost_price: 15.50, sale_price: 22.00, list_price: 22.00, unit: 'SET', safety_stock_days: 14 },
    // Semi-finished
    { code: 'SF-FR-001', name: '铝合金框架组件', type: 'semi_finished', cost_price: 180.00, sale_price: 220.00, list_price: 220.00, unit: 'PCS', safety_stock_days: 7 },
    { code: 'SF-SH-001', name: '不锈钢壳体', type: 'semi_finished', cost_price: 95.00, sale_price: 120.00, list_price: 120.00, unit: 'PCS', safety_stock_days: 7 },
    { code: 'SF-PCB-001', name: 'PCB 控制板', type: 'semi_finished', cost_price: 45.00, sale_price: 65.00, list_price: 65.00, unit: 'PCS', safety_stock_days: 14 },
    // Finished goods
    { code: 'FG-VLV-001', name: '工业电磁阀 DN25', type: 'finished_good', cost_price: 380.00, sale_price: 520.00, list_price: 520.00, unit: 'PCS', safety_stock_days: 14 },
    { code: 'FG-VLV-002', name: '工业电磁阀 DN50', type: 'finished_good', cost_price: 560.00, sale_price: 780.00, list_price: 780.00, unit: 'PCS', safety_stock_days: 14 },
    { code: 'FG-PMP-001', name: '离心泵 CYZ-50', type: 'finished_good', cost_price: 2800.00, sale_price: 3800.00, list_price: 3800.00, unit: 'PCS', safety_stock_days: 7 },
    { code: 'FG-PMP-002', name: '自吸泵 ZW-80', type: 'finished_good', cost_price: 4200.00, sale_price: 5600.00, list_price: 5600.00, unit: 'PCS', safety_stock_days: 7 },
    { code: 'FG-FLT-001', name: '精密过滤器 PF-100', type: 'finished_good', cost_price: 1500.00, sale_price: 2100.00, list_price: 2100.00, unit: 'PCS', safety_stock_days: 7 },
    { code: 'FG-ACT-001', name: '气动执行器 AT-40', type: 'finished_good', cost_price: 850.00, sale_price: 1200.00, list_price: 1200.00, unit: 'PCS', safety_stock_days: 7 },
    { code: 'FG-SNS-001', name: '压力传感器 PT-100', type: 'finished_good', cost_price: 320.00, sale_price: 450.00, list_price: 450.00, unit: 'PCS', safety_stock_days: 14 },
    // Packaging
    { code: 'PK-BOX-001', name: '标准纸箱 60x40x30', type: 'consumable', cost_price: 8.50, sale_price: 12.00, list_price: 12.00, unit: 'PCS', safety_stock_days: 30 },
    { code: 'PK-PLT-001', name: '木质托盘 1200x1000', type: 'consumable', cost_price: 65.00, sale_price: 85.00, list_price: 85.00, unit: 'PCS', safety_stock_days: 14 },
  ];

  return products.map((p) => ({
    ...p,
    _meta: { code: p.code, type: p.type, costPrice: p.cost_price, listPrice: p.list_price },
  }));
}

/** Extract ProductInfo array for transaction generators */
export function org1ProductInfos(): ProductInfo[] {
  return org1Products().map((p) => p._meta);
}

export function org1Customers() {
  return [
    { code: 'C001', name: '上海华能电力集团', customer_type: 'enterprise', classification: 'vip', email: 'purchase@huaneng-sh.com', phone: '021-58001001', credit_limit: 5000000, payment_terms: 60, contact: '王经理' },
    { code: 'C002', name: '中国石化上海分公司', customer_type: 'enterprise', classification: 'vip', email: 'proc@sinopec-sh.com', phone: '021-58002002', credit_limit: 10000000, payment_terms: 45, contact: '李总' },
    { code: 'C003', name: '宝山钢铁股份有限公司', customer_type: 'enterprise', classification: 'key', email: 'supply@baosteel.com', phone: '021-26641234', credit_limit: 8000000, payment_terms: 45, contact: '张采购' },
    { code: 'C004', name: '江苏恒力石化', customer_type: 'enterprise', classification: 'key', email: 'order@hengli.com', phone: '0512-87001234', credit_limit: 3000000, payment_terms: 30, contact: '赵经理' },
    { code: 'C005', name: '广州白云山制药', customer_type: 'enterprise', classification: 'standard', email: 'purchase@baiyunshan.com', phone: '020-83001234', credit_limit: 2000000, payment_terms: 30, contact: '陈主任' },
    { code: 'C006', name: '天津港保税区物流', customer_type: 'enterprise', classification: 'standard', email: 'logistics@tjport.com', phone: '022-65001234', credit_limit: 1500000, payment_terms: 30, contact: '刘工' },
    { code: 'C007', name: '杭州汇能环保科技', customer_type: 'enterprise', classification: 'standard', email: 'tech@huineng.com', phone: '0571-88001234', credit_limit: 1000000, payment_terms: 30, contact: '孙总' },
    { code: 'C008', name: '成都新希望化工', customer_type: 'enterprise', classification: 'standard', email: 'order@xinhope.com', phone: '028-86001234', credit_limit: 800000, payment_terms: 30, contact: '吴经理' },
    { code: 'C009', name: '武汉东湖水处理', customer_type: 'enterprise', classification: 'occasional', email: 'buy@donghu-water.com', phone: '027-87001234', credit_limit: 500000, payment_terms: 30, contact: '周主管' },
    { code: 'C010', name: '深圳鹏程电子', customer_type: 'enterprise', classification: 'occasional', email: 'sales@pengcheng.com', phone: '0755-26001234', credit_limit: 300000, payment_terms: 15, contact: '郑经理' },
    { code: 'C011', name: '南京扬子石化', customer_type: 'enterprise', classification: 'key', email: 'purchase@ypc.com', phone: '025-57001234', credit_limit: 6000000, payment_terms: 45, contact: '马总' },
    { code: 'C012', name: '青岛海信集团', customer_type: 'enterprise', classification: 'key', email: 'proc@hisense.com', phone: '0532-83001234', credit_limit: 4000000, payment_terms: 30, contact: '黄经理' },
    { code: 'C013', name: 'Pacific Engineering Ltd', customer_type: 'enterprise', classification: 'standard', email: 'order@pacific-eng.com', phone: '+65-6001-1234', credit_limit: 500000, payment_terms: 60, contact: 'John Lee' },
    { code: 'C014', name: 'Nippon Valve Corporation', customer_type: 'enterprise', classification: 'standard', email: 'sales@nippon-valve.co.jp', phone: '+81-3-1234-5678', credit_limit: 300000, payment_terms: 60, contact: 'Tanaka' },
    { code: 'C015', name: '重庆长安工业', customer_type: 'enterprise', classification: 'standard', email: 'buy@changan-ind.com', phone: '023-68001234', credit_limit: 1200000, payment_terms: 30, contact: '何经理' },
  ];
}

export function org1Suppliers() {
  return [
    { code: 'S001', name: '宁波永信铝业', supplier_type: 'material', contact_email: 'sales@yongxin-al.com', contact_phone: '0574-87001234', country: 'CN', currency: 'CNY', payment_terms: '30', lead_time_days: 7, reliability_score: 0.95, contact_person: '钱总' },
    { code: 'S002', name: '太钢不锈钢经销', supplier_type: 'material', contact_email: 'order@tisco-dealer.com', contact_phone: '0351-42001234', country: 'CN', currency: 'CNY', payment_terms: '45', lead_time_days: 10, reliability_score: 0.92, contact_person: '韩经理' },
    { code: 'S003', name: '昆山精密铸造', supplier_type: 'subcontractor', contact_email: 'biz@ks-casting.com', contact_phone: '0512-57001234', country: 'CN', currency: 'CNY', payment_terms: '30', lead_time_days: 14, reliability_score: 0.88, contact_person: '朱总' },
    { code: 'S004', name: '广东华南橡塑', supplier_type: 'material', contact_email: 'supply@hn-rubber.com', contact_phone: '0769-22001234', country: 'CN', currency: 'CNY', payment_terms: '30', lead_time_days: 7, reliability_score: 0.90, contact_person: '唐经理' },
    { code: 'S005', name: '深圳兴华电子', supplier_type: 'material', contact_email: 'components@xh-elec.com', contact_phone: '0755-86001234', country: 'CN', currency: 'CNY', payment_terms: '15', lead_time_days: 5, reliability_score: 0.93, contact_person: '冯工' },
    { code: 'S006', name: '河北邯郸铜材', supplier_type: 'material', contact_email: 'sales@hd-copper.com', contact_phone: '0310-31001234', country: 'CN', currency: 'CNY', payment_terms: '30', lead_time_days: 10, reliability_score: 0.87, contact_person: '曹经理' },
    { code: 'S007', name: '苏州工业包装', supplier_type: 'material', contact_email: 'pack@sz-package.com', contact_phone: '0512-65001234', country: 'CN', currency: 'CNY', payment_terms: '15', lead_time_days: 3, reliability_score: 0.96, contact_person: '蒋主管' },
    { code: 'S008', name: '上海申通快递物流', supplier_type: 'logistics', contact_email: 'biz@sto-logistics.com', contact_phone: '021-39001234', country: 'CN', currency: 'CNY', payment_terms: '30', lead_time_days: 2, reliability_score: 0.91, contact_person: '沈经理' },
    { code: 'S009', name: 'Osaka Metal Trading', supplier_type: 'material', contact_email: 'trade@osaka-metal.jp', contact_phone: '+81-6-1234-5678', country: 'JP', currency: 'USD', payment_terms: '60', lead_time_days: 21, reliability_score: 0.94, contact_person: 'Yamada' },
    { code: 'S010', name: '巴斯夫化工（中国）', supplier_type: 'material', contact_email: 'china@basf.com', contact_phone: '021-20001234', country: 'CN', currency: 'CNY', payment_terms: '45', lead_time_days: 14, reliability_score: 0.97, contact_person: '林经理' },
  ];
}

export function org1Warehouses() {
  return [
    { code: 'WH-MAIN', name: '主仓库', location: '上海市嘉定区曹安公路1234号', type: 'standard', status: 'active' },
    { code: 'WH-RAW', name: '原材料仓库', location: '上海市嘉定区曹安公路1234号-B区', type: 'standard', status: 'active' },
    { code: 'WH-FIN', name: '成品仓库', location: '上海市嘉定区曹安公路1234号-C区', type: 'standard', status: 'active' },
  ];
}

export function org1StorageLocations() {
  return [
    { warehouse_code: 'WH-MAIN', code: 'A-01-01', name: '主库A区1排1层' },
    { warehouse_code: 'WH-MAIN', code: 'A-01-02', name: '主库A区1排2层' },
    { warehouse_code: 'WH-MAIN', code: 'A-02-01', name: '主库A区2排1层' },
    { warehouse_code: 'WH-RAW', code: 'R-01-01', name: '原材料库1排1层' },
    { warehouse_code: 'WH-RAW', code: 'R-01-02', name: '原材料库1排2层' },
    { warehouse_code: 'WH-RAW', code: 'R-02-01', name: '原材料库2排1层' },
    { warehouse_code: 'WH-FIN', code: 'F-01-01', name: '成品库1排1层' },
    { warehouse_code: 'WH-FIN', code: 'F-01-02', name: '成品库1排2层' },
    { warehouse_code: 'WH-FIN', code: 'F-02-01', name: '成品库2排1层' },
  ];
}

export function org1AccountSubjects() {
  return [
    // Assets
    { code: '1001', name: '库存现金', category: 'asset', balance_direction: 'debit', is_leaf: true },
    { code: '1002', name: '银行存款', category: 'asset', balance_direction: 'debit', is_leaf: true },
    { code: '1122', name: '应收账款', category: 'asset', balance_direction: 'debit', is_leaf: true },
    { code: '1221', name: '其他应收款', category: 'asset', balance_direction: 'debit', is_leaf: true },
    { code: '1401', name: '原材料', category: 'asset', balance_direction: 'debit', is_leaf: true },
    { code: '1405', name: '库存商品', category: 'asset', balance_direction: 'debit', is_leaf: true },
    { code: '1601', name: '固定资产', category: 'asset', balance_direction: 'debit', is_leaf: true },
    { code: '1602', name: '累计折旧', category: 'asset', balance_direction: 'credit', is_leaf: true },
    // Liabilities
    { code: '2202', name: '应付账款', category: 'liability', balance_direction: 'credit', is_leaf: true },
    { code: '2211', name: '应付职工薪酬', category: 'liability', balance_direction: 'credit', is_leaf: true },
    { code: '2221', name: '应交税费', category: 'liability', balance_direction: 'credit', is_leaf: true },
    { code: '2241', name: '其他应付款', category: 'liability', balance_direction: 'credit', is_leaf: true },
    // Equity
    { code: '4001', name: '实收资本', category: 'equity', balance_direction: 'credit', is_leaf: true },
    { code: '4101', name: '盈余公积', category: 'equity', balance_direction: 'credit', is_leaf: true },
    { code: '4103', name: '本年利润', category: 'equity', balance_direction: 'credit', is_leaf: true },
    { code: '4104', name: '利润分配', category: 'equity', balance_direction: 'credit', is_leaf: true },
    // Revenue
    { code: '6001', name: '主营业务收入', category: 'revenue', balance_direction: 'credit', is_leaf: true },
    { code: '6051', name: '其他业务收入', category: 'revenue', balance_direction: 'credit', is_leaf: true },
    // Expenses
    { code: '6401', name: '主营业务成本', category: 'expense', balance_direction: 'debit', is_leaf: true },
    { code: '6402', name: '其他业务成本', category: 'expense', balance_direction: 'debit', is_leaf: true },
    { code: '6601', name: '销售费用', category: 'expense', balance_direction: 'debit', is_leaf: true },
    { code: '6602', name: '管理费用', category: 'expense', balance_direction: 'debit', is_leaf: true },
    { code: '6603', name: '财务费用', category: 'expense', balance_direction: 'debit', is_leaf: true },
    { code: '6711', name: '营业外支出', category: 'expense', balance_direction: 'debit', is_leaf: true },
  ];
}

export function org1CostCenters() {
  return [
    { code: 'CC-MGMT', name: '管理中心' },
    { code: 'CC-SALES', name: '销售中心' },
    { code: 'CC-PROD', name: '生产中心' },
    { code: 'CC-RD', name: '研发中心' },
  ];
}

export function org1DefectCodes() {
  return [
    { code: 'D001', name: '尺寸超差', category: 'process', severity: 'major', description: '产品尺寸超出公差范围', corrective_action: '调整加工参数，重新校准设备', is_active: true },
    { code: 'D002', name: '表面划伤', category: 'process', severity: 'minor', description: '产品表面有明显划痕', corrective_action: '改善搬运流程，增加防护包装', is_active: true },
    { code: 'D003', name: '材料缺陷', category: 'material', severity: 'critical', description: '原材料内部缺陷（夹渣、气孔等）', corrective_action: '加强来料检验，更换供应商批次', is_active: true },
    { code: 'D004', name: '装配不良', category: 'human', severity: 'major', description: '部件装配不到位或错装', corrective_action: '强化操作培训，增加检查工序', is_active: true },
    { code: 'D005', name: '焊接缺陷', category: 'process', severity: 'critical', description: '焊缝气孔、裂纹、虚焊等', corrective_action: '检查焊接参数，重新培训焊工', is_active: true },
    { code: 'D006', name: '涂层脱落', category: 'process', severity: 'minor', description: '表面涂层附着力不足', corrective_action: '检查前处理工艺，调整涂层配方', is_active: true },
  ];
}

export function org1ExchangeRates() {
  // Monthly exchange rates Oct 2025 - Mar 2026
  const rates: Array<Record<string, unknown>> = [];
  const usdRates = [7.08, 7.10, 7.12, 7.09, 7.06, 7.11];
  const eurRates = [7.68, 7.72, 7.75, 7.70, 7.65, 7.73];
  const months = ['2025-10-01', '2025-11-01', '2025-12-01', '2026-01-01', '2026-02-01', '2026-03-01'];

  for (let i = 0; i < months.length; i++) {
    rates.push(
      { from_currency: 'USD', to_currency: 'CNY', rate_type: 'spot', rate: usdRates[i], effective_date: months[i] },
      { from_currency: 'EUR', to_currency: 'CNY', rate_type: 'spot', rate: eurRates[i], effective_date: months[i] },
    );
  }
  return rates;
}

export function org1FixedAssets() {
  return [
    { asset_number: 'FA-001', asset_name: 'CNC车床 DMG-500', category: 'equipment', acquisition_date: '2023-03-15', acquisition_cost: 850000, salvage_value: 85000, useful_life_months: 120, depreciation_method: 'straight_line', location: '生产车间A', department: '生产部', status: 'in_use' },
    { asset_number: 'FA-002', asset_name: '数控铣床 VF-3SS', category: 'equipment', acquisition_date: '2023-06-20', acquisition_cost: 620000, salvage_value: 62000, useful_life_months: 120, depreciation_method: 'straight_line', location: '生产车间A', department: '生产部', status: 'in_use' },
    { asset_number: 'FA-003', asset_name: '激光切割机 LC-3015', category: 'equipment', acquisition_date: '2024-01-10', acquisition_cost: 1200000, salvage_value: 120000, useful_life_months: 96, depreciation_method: 'straight_line', location: '生产车间B', department: '生产部', status: 'in_use' },
    { asset_number: 'FA-004', asset_name: '叉车 合力CPCD30', category: 'vehicle', acquisition_date: '2023-09-01', acquisition_cost: 180000, salvage_value: 18000, useful_life_months: 96, depreciation_method: 'straight_line', location: '仓库', department: '仓储物流部', status: 'in_use' },
    { asset_number: 'FA-005', asset_name: '厢式货车 东风EQ5100', category: 'vehicle', acquisition_date: '2024-03-15', acquisition_cost: 250000, salvage_value: 25000, useful_life_months: 96, depreciation_method: 'straight_line', location: '停车场', department: '仓储物流部', status: 'in_use' },
    { asset_number: 'FA-006', asset_name: '空压机系统 Atlas GA30', category: 'equipment', acquisition_date: '2023-12-01', acquisition_cost: 95000, salvage_value: 9500, useful_life_months: 120, depreciation_method: 'straight_line', location: '动力车间', department: '生产部', status: 'in_use' },
    { asset_number: 'FA-007', asset_name: 'ERP服务器集群', category: 'it_equipment', acquisition_date: '2025-06-01', acquisition_cost: 120000, salvage_value: 12000, useful_life_months: 60, depreciation_method: 'straight_line', location: '机房', department: '总经理办公室', status: 'in_use' },
    { asset_number: 'FA-008', asset_name: '办公家具(整批)', category: 'furniture', acquisition_date: '2023-01-15', acquisition_cost: 85000, salvage_value: 8500, useful_life_months: 60, depreciation_method: 'straight_line', location: '办公区', department: '总经理办公室', status: 'in_use' },
  ];
}

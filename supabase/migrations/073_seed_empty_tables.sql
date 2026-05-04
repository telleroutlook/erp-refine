-- Seed data for tables that appear empty in the UI
-- These are master data and transactional records needed for demo purposes

-- 1. defect_codes (质量缺陷代码 - 主数据)
INSERT INTO defect_codes (id, organization_id, code, name, category, severity, description, is_active) VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'DC-001', '表面划伤', '外观', 'minor', '产品表面存在轻微划痕，不影响功能', true),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'DC-002', '尺寸超差', '尺寸', 'major', '产品尺寸超出公差范围', true),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'DC-003', '裂纹', '结构', 'critical', '产品存在裂纹，影响结构强度', true),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'DC-004', '色差', '外观', 'minor', '产品颜色与标准色板存在差异', true),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'DC-005', '气泡', '结构', 'major', '铸造或注塑产品内部存在气泡', true),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'DC-006', '焊接缺陷', '工艺', 'critical', '焊缝存在未熔合、气孔等缺陷', true),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'DC-007', '毛刺', '外观', 'minor', '零件边缘存在毛刺未去除', true),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'DC-008', '硬度不合格', '材料', 'major', '材料硬度测试结果不在合格范围内', true);

-- 2. quality_standards (质量标准 - 主数据)
INSERT INTO quality_standards (id, organization_id, standard_code, standard_name, description, is_active) VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'QS-ISO9001', 'ISO 9001:2015', '质量管理体系要求', true),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'QS-GB1804', 'GB/T 1804-2000', '一般公差 未注公差的线性和角度尺寸的公差', true),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'QS-ISO2768', 'ISO 2768-1', '一般公差 第1部分：未注出公差的线性和角度尺寸的公差', true),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'QS-GB5310', 'GB 5310-2017', '高压锅炉用无缝钢管', true),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'QS-ASTM', 'ASTM A240', '铬和铬镍不锈钢板、薄板和带材标准规范', true),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'QS-GB3280', 'GB/T 3280-2015', '不锈钢冷轧钢板和钢带', true);

-- 3. storage_locations (库位 - 主数据, FK to warehouses)
INSERT INTO storage_locations (id, organization_id, warehouse_id, code, name, zone, is_active) VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'a0d57e87-1761-4ed9-817d-cf0f07032123', 'A-01-01', 'A区1排1层', 'A', true),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'a0d57e87-1761-4ed9-817d-cf0f07032123', 'A-01-02', 'A区1排2层', 'A', true),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'a0d57e87-1761-4ed9-817d-cf0f07032123', 'A-02-01', 'A区2排1层', 'A', true),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'a0d57e87-1761-4ed9-817d-cf0f07032123', 'B-01-01', 'B区1排1层', 'B', true),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '32c46ed2-f577-4741-bb86-e8564d4492f1', 'C-01-01', 'C区1排1层', 'C', true),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '32c46ed2-f577-4741-bb86-e8564d4492f1', 'C-01-02', 'C区1排2层', 'C', true),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '3e0401ce-56f4-4a9d-a76d-c9318416d931', 'R-01-01', '原料区1排1层', 'R', true),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '3e0401ce-56f4-4a9d-a76d-c9318416d931', 'R-01-02', '原料区1排2层', 'R', true);

-- 4. work_order_productions (生产报工 - 关联工单)
INSERT INTO work_order_productions (id, work_order_id, production_date, quantity, qualified_quantity, defective_quantity, created_by, notes) VALUES
  (gen_random_uuid(), '8df44b23-67c6-40ad-9679-f3ce7b8f89df', '2026-03-20', 50, 48, 2, '41eb8e92-e949-49f2-bda3-5039917b102c', '第一批次完工'),
  (gen_random_uuid(), '8df44b23-67c6-40ad-9679-f3ce7b8f89df', '2026-03-22', 30, 30, 0, '41eb8e92-e949-49f2-bda3-5039917b102c', '第二批次完工，全部合格'),
  (gen_random_uuid(), 'cb98038c-0317-4a21-adba-3162130c68dd', '2026-04-05', 100, 97, 3, '5df410f6-17c2-44a1-b855-8de38de42724', '完成100件，3件表面缺陷'),
  (gen_random_uuid(), '6a3a81b5-e570-4189-ba2c-06b483adc511', '2026-04-18', 40, 38, 2, 'f58e54f5-e8c5-4465-8305-ef1a64a6c6f3', '本日产量40件'),
  (gen_random_uuid(), 'f6f95267-df38-45f3-8387-cf38dfebf234', '2026-04-20', 25, 25, 0, '5df410f6-17c2-44a1-b855-8de38de42724', '全部合格'),
  (gen_random_uuid(), 'f279914b-0751-4153-8cd3-408157c833fa', '2026-04-02', 60, 58, 2, '41eb8e92-e949-49f2-bda3-5039917b102c', '已完成全部产量');

-- 5. payment_records (付款/收款记录)
INSERT INTO payment_records (id, organization_id, payment_number, payment_type, payment_method, amount, payment_date, partner_type, partner_id, reference_type, reference_id, account_subject_id, status, created_by, notes) VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'PAY-2026-001', 'payable', 'bank_transfer', 125000.00, '2026-03-15', 'supplier', 'b8699d8a-a278-44d5-974e-21f3271639ca', 'supplier_invoice', 'e6d1e3d2-3fdb-4254-8183-a84f49ed907e', '5fc417a5-ca85-4a84-b93f-0eeeed7c83c9', 'confirmed', '41eb8e92-e949-49f2-bda3-5039917b102c', '支付深圳兴华电子发票款'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'PAY-2026-002', 'payable', 'bank_transfer', 88500.00, '2026-03-22', 'supplier', '8988fa5b-7493-4703-84d2-8d2616454f86', 'supplier_invoice', '7031b63c-114f-43ca-a562-d760cb54a625', '5fc417a5-ca85-4a84-b93f-0eeeed7c83c9', 'confirmed', '41eb8e92-e949-49f2-bda3-5039917b102c', '支付河北邯郸铜材发票款'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'PAY-2026-003', 'receivable', 'bank_transfer', 256000.00, '2026-04-01', 'customer', '661106bc-57a2-4b65-be85-0fb81ebae545', 'sales_invoice', NULL, '2af17493-7d9f-4c48-b02b-e8848dd030eb', 'confirmed', '5cf42c30-d1e0-4889-ab47-ab39adcd66ef', '收到青岛海信集团货款'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'PAY-2026-004', 'receivable', 'check', 178000.00, '2026-04-10', 'customer', '42b072bb-525c-4d2a-98e3-1cbd0227bcff', 'sales_invoice', NULL, '2af17493-7d9f-4c48-b02b-e8848dd030eb', 'confirmed', '5cf42c30-d1e0-4889-ab47-ab39adcd66ef', '收到重庆长安工业支票'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'PAY-2026-005', 'payable', 'cash', 3200.00, '2026-04-12', 'supplier', '03c66c80-7bd6-4014-8f51-def76c06bf7d', 'payment_request', NULL, '5fc417a5-ca85-4a84-b93f-0eeeed7c83c9', 'draft', 'f58e54f5-e8c5-4465-8305-ef1a64a6c6f3', '快递物流费用');

-- 6. product_cost_history (产品成本变动历史)
INSERT INTO product_cost_history (id, organization_id, product_id, unit_cost, total_value, total_quantity, cost_method, effective_date, reference_type, reference_id) VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'b55b3b10-cd8a-4017-a004-26d43dd53861', 45.50, 22750.00, 500, 'weighted_average', '2026-01-15', 'purchase_receipt', 'a79b7763-8b5e-4b61-b64c-e21c817179a2'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'b55b3b10-cd8a-4017-a004-26d43dd53861', 46.20, 46200.00, 1000, 'weighted_average', '2026-02-20', 'purchase_receipt', '9a69ccd4-9f73-490f-966c-c28a6535af7d'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'a5d25404-89ac-4133-b440-4f8614b2900d', 128.00, 25600.00, 200, 'weighted_average', '2026-01-20', 'purchase_receipt', 'a9a05eaf-9a7d-4ebd-96a1-441d7edc65f3'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'a5d25404-89ac-4133-b440-4f8614b2900d', 131.50, 39450.00, 300, 'weighted_average', '2026-03-10', 'purchase_receipt', 'd93bd12f-4c85-411e-a888-34eccba0396c'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'ac7adeab-c0a2-4029-b2f4-631f5dd54593', 88.00, 44000.00, 500, 'weighted_average', '2026-02-01', 'purchase_receipt', '1bf573bb-d1e5-428a-8c98-a910f9630e76'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '6674bd2c-b7ca-4d88-b557-1da719920aaf', 320.00, 32000.00, 100, 'standard', '2026-03-01', 'work_order', '8df44b23-67c6-40ad-9679-f3ce7b8f89df');

-- 7. three_way_match_results (三方匹配结果)
INSERT INTO three_way_match_results (id, organization_id, purchase_order_id, purchase_receipt_id, supplier_invoice_id, match_status, quantity_variance, price_variance, amount_variance, matched_by, matched_at, notes) VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '2fa99f18-e80c-4539-8e59-533acca836ea', 'a79b7763-8b5e-4b61-b64c-e21c817179a2', 'e6d1e3d2-3fdb-4254-8183-a84f49ed907e', 'matched', 0, 0, 0, '41eb8e92-e949-49f2-bda3-5039917b102c', '2026-03-18', '完全匹配'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '7cd0dea0-6299-465a-9c1a-9dd24d9114c9', '9a69ccd4-9f73-490f-966c-c28a6535af7d', '7031b63c-114f-43ca-a562-d760cb54a625', 'matched', 0, 0.5, 250.00, '41eb8e92-e949-49f2-bda3-5039917b102c', '2026-03-25', '价格微差在允许范围内'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'c303e4eb-f1c0-40bd-b70e-455e54fe5072', 'a9a05eaf-9a7d-4ebd-96a1-441d7edc65f3', '63a2d935-b838-4111-9fcf-64644b02e35e', 'partial', 5, 0, 1500.00, '5cf42c30-d1e0-4889-ab47-ab39adcd66ef', '2026-04-02', '收货数量少于订单数量5件'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'd62aa909-2e2b-4de3-8a78-35fed430bccc', 'd93bd12f-4c85-411e-a888-34eccba0396c', NULL, 'pending', 0, 0, 0, NULL, NULL, '等待供应商发票'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'c3d40b3e-ac46-49fb-bcc8-56c61069fcfb', '1bf573bb-d1e5-428a-8c98-a910f9630e76', NULL, 'mismatch', 10, 2.5, 5800.00, '41eb8e92-e949-49f2-bda3-5039917b102c', '2026-04-15', '数量和价格均存在差异，需要核实');

-- 8. approval_records (审批记录)
INSERT INTO approval_records (id, organization_id, document_type, document_id, rule_id, status, decision_level, decision_by, decision_at, comments, created_by) VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'purchase_order', '2fa99f18-e80c-4539-8e59-533acca836ea', '108ca017-9b54-4a0f-8846-e83d22f7a070', 'approved', 1, '41eb8e92-e949-49f2-bda3-5039917b102c', '2026-03-10 09:30:00', '同意采购', '41eb8e92-e949-49f2-bda3-5039917b102c'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'purchase_order', '7cd0dea0-6299-465a-9c1a-9dd24d9114c9', '108ca017-9b54-4a0f-8846-e83d22f7a070', 'approved', 1, '5bb4c04e-87e8-4d2c-9451-39e17cefcb06', '2026-03-12 14:20:00', '价格合理，同意', '41eb8e92-e949-49f2-bda3-5039917b102c'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'purchase_order', 'c303e4eb-f1c0-40bd-b70e-455e54fe5072', '108ca017-9b54-4a0f-8846-e83d22f7a070', 'rejected', 1, '5bb4c04e-87e8-4d2c-9451-39e17cefcb06', '2026-03-15 10:45:00', '金额超出预算，请调整', '41eb8e92-e949-49f2-bda3-5039917b102c'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'payment_request', NULL, '6cca7dad-d43a-4c2b-b6ad-24961e790007', 'approved', 2, '5bb4c04e-87e8-4d2c-9451-39e17cefcb06', '2026-04-01 16:00:00', '费用合理，批准支付', '5cf42c30-d1e0-4889-ab47-ab39adcd66ef'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'work_order', '8df44b23-67c6-40ad-9679-f3ce7b8f89df', NULL, 'approved', 1, '5df410f6-17c2-44a1-b855-8de38de42724', '2026-03-18 08:30:00', '生产计划已确认', '41eb8e92-e949-49f2-bda3-5039917b102c'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'budget', NULL, '89c271a7-4ae2-462d-afef-20f4f15699e9', 'pending', 1, NULL, NULL, NULL, '5cf42c30-d1e0-4889-ab47-ab39adcd66ef');

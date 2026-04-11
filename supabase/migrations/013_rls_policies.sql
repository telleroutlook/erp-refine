-- 013_rls_policies.sql
-- Row-Level Security policies for all tables

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE number_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_list_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE serial_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_count_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requisition_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_headers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_quotation_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE three_way_match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_shipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE bom_headers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bom_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_productions ENABLE ROW LEVEL SECURITY;
ALTER TABLE defect_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_standard_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_inspection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_depreciations ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_call_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE schema_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE schema_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE dynamic_form_data ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper: reusable org check
-- ============================================================

-- Organizations: users see their own org
CREATE POLICY "org_select" ON organizations FOR SELECT TO authenticated
  USING (id = get_user_org_id());
CREATE POLICY "org_admin_write" ON organizations FOR ALL TO authenticated
  USING (id = get_user_org_id() AND get_user_role() = 'admin');

-- ============================================================
-- Generic org-scoped SELECT policy (all authenticated users)
-- ============================================================

-- Macro: create read + write policies for org-scoped tables
-- Read: all authenticated users in same org
-- Write: admin + manager + domain-specific roles

-- Infrastructure
CREATE POLICY "departments_read" ON departments FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "departments_write" ON departments FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'manager'));

CREATE POLICY "employees_read" ON employees FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "employees_write" ON employees FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() = 'admin');

CREATE POLICY "exchange_rates_read" ON exchange_rates FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "exchange_rates_write" ON exchange_rates FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'finance_manager'));

CREATE POLICY "number_sequences_read" ON number_sequences FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "number_sequences_write" ON number_sequences FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() = 'admin');

CREATE POLICY "approval_rules_read" ON approval_rules FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "approval_rules_write" ON approval_rules FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() = 'admin');

CREATE POLICY "approval_records_read" ON approval_records FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "approval_records_write" ON approval_records FOR INSERT TO authenticated WITH CHECK (organization_id = get_user_org_id());

-- Master Data (admin + manager + domain roles can write)
CREATE POLICY "tax_codes_read" ON tax_codes FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "tax_codes_write" ON tax_codes FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'finance_manager'));

CREATE POLICY "product_categories_read" ON product_categories FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "product_categories_write" ON product_categories FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'manager'));

CREATE POLICY "products_read" ON products FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "products_write" ON products FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'manager', 'inventory_manager'));

CREATE POLICY "customers_read" ON customers FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "customers_write" ON customers FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'manager', 'sales_manager'));

CREATE POLICY "customer_addresses_read" ON customer_addresses FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "customer_addresses_write" ON customer_addresses FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'manager', 'sales_manager'));

CREATE POLICY "customer_bank_accounts_read" ON customer_bank_accounts FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "customer_bank_accounts_write" ON customer_bank_accounts FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'finance_manager'));

CREATE POLICY "suppliers_read" ON suppliers FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "suppliers_write" ON suppliers FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'manager', 'procurement_manager'));

CREATE POLICY "supplier_sites_read" ON supplier_sites FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "supplier_sites_write" ON supplier_sites FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'manager', 'procurement_manager'));

CREATE POLICY "supplier_bank_accounts_read" ON supplier_bank_accounts FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "supplier_bank_accounts_write" ON supplier_bank_accounts FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'finance_manager'));

CREATE POLICY "warehouses_read" ON warehouses FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "warehouses_write" ON warehouses FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'manager', 'inventory_manager'));

CREATE POLICY "storage_locations_read" ON storage_locations FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "storage_locations_write" ON storage_locations FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'inventory_manager'));

CREATE POLICY "carriers_read" ON carriers FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "carriers_write" ON carriers FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'manager'));

CREATE POLICY "price_lists_read" ON price_lists FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "price_lists_write" ON price_lists FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'sales_manager', 'procurement_manager'));

CREATE POLICY "price_list_lines_read" ON price_list_lines FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM price_lists pl WHERE pl.id = price_list_id AND pl.organization_id = get_user_org_id()));
CREATE POLICY "price_list_lines_write" ON price_list_lines FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM price_lists pl WHERE pl.id = price_list_id AND pl.organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'sales_manager', 'procurement_manager')));

-- Inventory
CREATE POLICY "stock_records_read" ON stock_records FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "stock_records_write" ON stock_records FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'inventory_manager'));

CREATE POLICY "stock_transactions_read" ON stock_transactions FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "stock_transactions_insert" ON stock_transactions FOR INSERT TO authenticated WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "inventory_lots_read" ON inventory_lots FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "inventory_lots_write" ON inventory_lots FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'inventory_manager'));

CREATE POLICY "serial_numbers_read" ON serial_numbers FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "serial_numbers_write" ON serial_numbers FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'inventory_manager'));

CREATE POLICY "inventory_reservations_read" ON inventory_reservations FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "inventory_reservations_write" ON inventory_reservations FOR ALL TO authenticated USING (organization_id = get_user_org_id());

CREATE POLICY "inventory_counts_read" ON inventory_counts FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "inventory_counts_write" ON inventory_counts FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'inventory_manager'));

CREATE POLICY "inventory_count_lines_read" ON inventory_count_lines FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM inventory_counts ic WHERE ic.id = inventory_count_id AND ic.organization_id = get_user_org_id()));
CREATE POLICY "inventory_count_lines_write" ON inventory_count_lines FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM inventory_counts ic WHERE ic.id = inventory_count_id AND ic.organization_id = get_user_org_id()));

-- Procurement
CREATE POLICY "purchase_requisitions_read" ON purchase_requisitions FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "purchase_requisitions_write" ON purchase_requisitions FOR ALL TO authenticated USING (organization_id = get_user_org_id());

CREATE POLICY "purchase_requisition_lines_read" ON purchase_requisition_lines FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM purchase_requisitions pr WHERE pr.id = purchase_requisition_id AND pr.organization_id = get_user_org_id()));
CREATE POLICY "purchase_requisition_lines_write" ON purchase_requisition_lines FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM purchase_requisitions pr WHERE pr.id = purchase_requisition_id AND pr.organization_id = get_user_org_id()));

CREATE POLICY "rfq_headers_read" ON rfq_headers FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "rfq_headers_write" ON rfq_headers FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'manager', 'procurement_manager'));

CREATE POLICY "rfq_lines_read" ON rfq_lines FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM rfq_headers h WHERE h.id = rfq_header_id AND h.organization_id = get_user_org_id()));
CREATE POLICY "rfq_lines_write" ON rfq_lines FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM rfq_headers h WHERE h.id = rfq_header_id AND h.organization_id = get_user_org_id()));

CREATE POLICY "supplier_quotations_read" ON supplier_quotations FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "supplier_quotations_write" ON supplier_quotations FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'manager', 'procurement_manager'));

CREATE POLICY "supplier_quotation_lines_read" ON supplier_quotation_lines FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM supplier_quotations sq WHERE sq.id = supplier_quotation_id AND sq.organization_id = get_user_org_id()));
CREATE POLICY "supplier_quotation_lines_write" ON supplier_quotation_lines FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM supplier_quotations sq WHERE sq.id = supplier_quotation_id AND sq.organization_id = get_user_org_id()));

CREATE POLICY "purchase_orders_read" ON purchase_orders FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "purchase_orders_write" ON purchase_orders FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'manager', 'procurement_manager'));

CREATE POLICY "purchase_order_items_read" ON purchase_order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM purchase_orders po WHERE po.id = purchase_order_id AND po.organization_id = get_user_org_id()));
CREATE POLICY "purchase_order_items_write" ON purchase_order_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM purchase_orders po WHERE po.id = purchase_order_id AND po.organization_id = get_user_org_id()));

CREATE POLICY "purchase_receipts_read" ON purchase_receipts FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "purchase_receipts_write" ON purchase_receipts FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'manager', 'procurement_manager', 'inventory_manager'));

CREATE POLICY "purchase_receipt_items_read" ON purchase_receipt_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM purchase_receipts pr WHERE pr.id = purchase_receipt_id AND pr.organization_id = get_user_org_id()));
CREATE POLICY "purchase_receipt_items_write" ON purchase_receipt_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM purchase_receipts pr WHERE pr.id = purchase_receipt_id AND pr.organization_id = get_user_org_id()));

CREATE POLICY "supplier_invoices_read" ON supplier_invoices FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "supplier_invoices_write" ON supplier_invoices FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'manager', 'finance_manager', 'procurement_manager'));

CREATE POLICY "supplier_invoice_items_read" ON supplier_invoice_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM supplier_invoices si WHERE si.id = supplier_invoice_id AND si.organization_id = get_user_org_id()));
CREATE POLICY "supplier_invoice_items_write" ON supplier_invoice_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM supplier_invoices si WHERE si.id = supplier_invoice_id AND si.organization_id = get_user_org_id()));

CREATE POLICY "three_way_match_read" ON three_way_match_results FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "three_way_match_write" ON three_way_match_results FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'finance_manager'));

CREATE POLICY "payment_requests_read" ON payment_requests FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "payment_requests_write" ON payment_requests FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'manager', 'finance_manager'));

-- Sales
CREATE POLICY "sales_orders_read" ON sales_orders FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "sales_orders_write" ON sales_orders FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'manager', 'sales_manager'));

CREATE POLICY "sales_order_items_read" ON sales_order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM sales_orders so WHERE so.id = sales_order_id AND so.organization_id = get_user_org_id()));
CREATE POLICY "sales_order_items_write" ON sales_order_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM sales_orders so WHERE so.id = sales_order_id AND so.organization_id = get_user_org_id()));

CREATE POLICY "sales_shipments_read" ON sales_shipments FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "sales_shipments_write" ON sales_shipments FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'manager', 'sales_manager', 'inventory_manager'));

CREATE POLICY "sales_shipment_items_read" ON sales_shipment_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM sales_shipments ss WHERE ss.id = sales_shipment_id AND ss.organization_id = get_user_org_id()));
CREATE POLICY "sales_shipment_items_write" ON sales_shipment_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM sales_shipments ss WHERE ss.id = sales_shipment_id AND ss.organization_id = get_user_org_id()));

CREATE POLICY "sales_invoices_read" ON sales_invoices FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "sales_invoices_write" ON sales_invoices FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'manager', 'finance_manager', 'sales_manager'));

CREATE POLICY "sales_invoice_items_read" ON sales_invoice_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM sales_invoices si WHERE si.id = sales_invoice_id AND si.organization_id = get_user_org_id()));
CREATE POLICY "sales_invoice_items_write" ON sales_invoice_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM sales_invoices si WHERE si.id = sales_invoice_id AND si.organization_id = get_user_org_id()));

CREATE POLICY "sales_returns_read" ON sales_returns FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "sales_returns_write" ON sales_returns FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'manager', 'sales_manager'));

CREATE POLICY "sales_return_items_read" ON sales_return_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM sales_returns sr WHERE sr.id = sales_return_id AND sr.organization_id = get_user_org_id()));
CREATE POLICY "sales_return_items_write" ON sales_return_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM sales_returns sr WHERE sr.id = sales_return_id AND sr.organization_id = get_user_org_id()));

CREATE POLICY "customer_receipts_read" ON customer_receipts FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "customer_receipts_write" ON customer_receipts FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'manager', 'finance_manager'));

-- Finance
CREATE POLICY "cost_centers_read" ON cost_centers FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "cost_centers_write" ON cost_centers FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'finance_manager'));

CREATE POLICY "account_subjects_read" ON account_subjects FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "account_subjects_write" ON account_subjects FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'finance_manager'));

CREATE POLICY "vouchers_read" ON vouchers FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "vouchers_write" ON vouchers FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'finance_manager'));

CREATE POLICY "voucher_entries_read" ON voucher_entries FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM vouchers v WHERE v.id = voucher_id AND v.organization_id = get_user_org_id()));
CREATE POLICY "voucher_entries_write" ON voucher_entries FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM vouchers v WHERE v.id = voucher_id AND v.organization_id = get_user_org_id()));

CREATE POLICY "budgets_read" ON budgets FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "budgets_write" ON budgets FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'finance_manager'));

CREATE POLICY "budget_lines_read" ON budget_lines FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM budgets b WHERE b.id = budget_id AND b.organization_id = get_user_org_id()));
CREATE POLICY "budget_lines_write" ON budget_lines FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM budgets b WHERE b.id = budget_id AND b.organization_id = get_user_org_id()));

CREATE POLICY "payment_records_read" ON payment_records FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "payment_records_insert" ON payment_records FOR INSERT TO authenticated WITH CHECK (organization_id = get_user_org_id());

-- Manufacturing
CREATE POLICY "bom_headers_read" ON bom_headers FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "bom_headers_write" ON bom_headers FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'manager', 'production_manager'));

CREATE POLICY "bom_items_read" ON bom_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM bom_headers bh WHERE bh.id = bom_header_id AND bh.organization_id = get_user_org_id()));
CREATE POLICY "bom_items_write" ON bom_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM bom_headers bh WHERE bh.id = bom_header_id AND bh.organization_id = get_user_org_id()));

CREATE POLICY "work_orders_read" ON work_orders FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "work_orders_write" ON work_orders FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'manager', 'production_manager'));

CREATE POLICY "work_order_materials_read" ON work_order_materials FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM work_orders wo WHERE wo.id = work_order_id AND wo.organization_id = get_user_org_id()));
CREATE POLICY "work_order_materials_write" ON work_order_materials FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM work_orders wo WHERE wo.id = work_order_id AND wo.organization_id = get_user_org_id()));

CREATE POLICY "work_order_productions_read" ON work_order_productions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM work_orders wo WHERE wo.id = work_order_id AND wo.organization_id = get_user_org_id()));
CREATE POLICY "work_order_productions_insert" ON work_order_productions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM work_orders wo WHERE wo.id = work_order_id AND wo.organization_id = get_user_org_id()));

-- Quality
CREATE POLICY "defect_codes_read" ON defect_codes FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "defect_codes_write" ON defect_codes FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'quality_manager'));

CREATE POLICY "quality_standards_read" ON quality_standards FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "quality_standards_write" ON quality_standards FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'quality_manager'));

CREATE POLICY "quality_standard_items_read" ON quality_standard_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM quality_standards qs WHERE qs.id = quality_standard_id AND qs.organization_id = get_user_org_id()));
CREATE POLICY "quality_standard_items_write" ON quality_standard_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM quality_standards qs WHERE qs.id = quality_standard_id AND qs.organization_id = get_user_org_id()));

CREATE POLICY "quality_inspections_read" ON quality_inspections FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "quality_inspections_write" ON quality_inspections FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'quality_manager'));

CREATE POLICY "quality_inspection_items_read" ON quality_inspection_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM quality_inspections qi WHERE qi.id = quality_inspection_id AND qi.organization_id = get_user_org_id()));
CREATE POLICY "quality_inspection_items_write" ON quality_inspection_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM quality_inspections qi WHERE qi.id = quality_inspection_id AND qi.organization_id = get_user_org_id()));

-- Contracts & Assets
CREATE POLICY "contracts_read" ON contracts FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "contracts_write" ON contracts FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'manager'));

CREATE POLICY "contract_items_read" ON contract_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM contracts c WHERE c.id = contract_id AND c.organization_id = get_user_org_id()));
CREATE POLICY "contract_items_write" ON contract_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM contracts c WHERE c.id = contract_id AND c.organization_id = get_user_org_id()));

CREATE POLICY "fixed_assets_read" ON fixed_assets FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "fixed_assets_write" ON fixed_assets FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'finance_manager'));

CREATE POLICY "asset_depreciations_read" ON asset_depreciations FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "asset_depreciations_insert" ON asset_depreciations FOR INSERT TO authenticated WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "asset_maintenance_read" ON asset_maintenance_records FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "asset_maintenance_write" ON asset_maintenance_records FOR ALL TO authenticated USING (organization_id = get_user_org_id());

-- AI Governance (all authenticated can read; insert only)
CREATE POLICY "agent_sessions_read" ON agent_sessions FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "agent_sessions_insert" ON agent_sessions FOR INSERT TO authenticated WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "agent_sessions_update" ON agent_sessions FOR UPDATE TO authenticated USING (organization_id = get_user_org_id());

CREATE POLICY "agent_decisions_read" ON agent_decisions FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "agent_decisions_insert" ON agent_decisions FOR INSERT TO authenticated WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "business_events_read" ON business_events FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "business_events_insert" ON business_events FOR INSERT TO authenticated WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "tool_call_metrics_read" ON tool_call_metrics FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "tool_call_metrics_insert" ON tool_call_metrics FOR INSERT TO authenticated WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "token_usage_read" ON token_usage FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "token_usage_insert" ON token_usage FOR INSERT TO authenticated WITH CHECK (organization_id = get_user_org_id());

-- Schema Registry
CREATE POLICY "schema_registry_read" ON schema_registry FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "schema_registry_write" ON schema_registry FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'manager'));

CREATE POLICY "schema_versions_read" ON schema_versions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM schema_registry sr WHERE sr.id = schema_registry_id AND sr.organization_id = get_user_org_id()));

CREATE POLICY "component_whitelist_read" ON component_whitelist FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "component_whitelist_write" ON component_whitelist FOR ALL TO authenticated USING (organization_id = get_user_org_id() AND get_user_role() = 'admin');

-- System
CREATE POLICY "workflows_read" ON workflows FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "workflows_write" ON workflows FOR ALL TO authenticated USING (organization_id = get_user_org_id());

CREATE POLICY "workflow_executions_read" ON workflow_executions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM workflows w WHERE w.id = workflow_id AND w.organization_id = get_user_org_id()));
CREATE POLICY "workflow_executions_write" ON workflow_executions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM workflows w WHERE w.id = workflow_id AND w.organization_id = get_user_org_id()));

CREATE POLICY "document_attachments_read" ON document_attachments FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "document_attachments_write" ON document_attachments FOR ALL TO authenticated USING (organization_id = get_user_org_id());

CREATE POLICY "notifications_read" ON notifications FOR SELECT TO authenticated USING (organization_id = get_user_org_id() AND recipient_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));
CREATE POLICY "notifications_update" ON notifications FOR UPDATE TO authenticated USING (organization_id = get_user_org_id() AND recipient_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

CREATE POLICY "dynamic_form_data_read" ON dynamic_form_data FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "dynamic_form_data_write" ON dynamic_form_data FOR ALL TO authenticated USING (organization_id = get_user_org_id());

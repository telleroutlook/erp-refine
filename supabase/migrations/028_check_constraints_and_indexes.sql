-- 028: Polymorphic CHECK constraints + missing indexes

-- 1. Polymorphic CHECK constraints (6 tables that lack them)
ALTER TABLE approval_records ADD CONSTRAINT chk_document_type
  CHECK (document_type IN ('purchase_order','sales_order','payment_request',
    'supplier_invoice','sales_invoice','budget','work_order'));

ALTER TABLE business_events ADD CONSTRAINT chk_entity_type
  CHECK (entity_type IN ('purchase_order','sales_order','supplier_invoice',
    'sales_invoice','work_order','inventory','payment_request','system'));

ALTER TABLE workflows ADD CONSTRAINT chk_entity_type
  CHECK (entity_type IN ('purchase_order','sales_order','supplier_invoice',
    'payment_request','work_order'));

ALTER TABLE document_attachments ADD CONSTRAINT chk_entity_type
  CHECK (entity_type IN ('purchase_order','sales_order','supplier_invoice',
    'sales_invoice','contract','fixed_asset','quality_inspection'));

ALTER TABLE customer_receipts ADD CONSTRAINT chk_reference_type
  CHECK (reference_type IS NULL OR reference_type IN ('sales_invoice','sales_order'));

ALTER TABLE payment_records ADD CONSTRAINT chk_reference_type
  CHECK (reference_type IS NULL OR reference_type IN ('supplier_invoice',
    'sales_invoice','payment_request'));

-- 2. Missing indexes on product_id for line item tables
CREATE INDEX IF NOT EXISTS idx_sales_invoice_items_product ON sales_invoice_items(product_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoice_items_product ON supplier_invoice_items(product_id);
CREATE INDEX IF NOT EXISTS idx_purchase_receipt_items_product ON purchase_receipt_items(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_shipment_items_product ON sales_shipment_items(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_return_items_product ON sales_return_items(product_id);

-- 3. Dashboard composite indexes
CREATE INDEX IF NOT EXISTS idx_po_org_status_date ON purchase_orders(organization_id, status, order_date);
CREATE INDEX IF NOT EXISTS idx_so_org_status_date ON sales_orders(organization_id, status, order_date);

-- 4. Event sourcing
CREATE INDEX IF NOT EXISTS idx_agent_decisions_session ON agent_decisions(session_id);

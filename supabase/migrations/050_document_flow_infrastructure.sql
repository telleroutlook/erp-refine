-- 050: Document flow infrastructure for reference creation (参考创建)
-- Adds line-level FK columns for invoice items, invoiced_quantity tracking,
-- and extends document_relations CHECK constraints to include purchase_requisition.

-- 1. Add purchase_requisition to document_relations CHECK constraints
ALTER TABLE document_relations DROP CONSTRAINT IF EXISTS chk_dr_from_object_type;
ALTER TABLE document_relations ADD CONSTRAINT chk_dr_from_object_type CHECK (
  from_object_type = ANY(ARRAY[
    'purchase_requisition','purchase_order','purchase_receipt',
    'sales_order','sales_shipment','sales_return',
    'supplier_invoice','sales_invoice',
    'payment_request','payment_record','customer_receipt',
    'contract','work_order','quality_inspection',
    'voucher','budget','fixed_asset'
  ])
);

ALTER TABLE document_relations DROP CONSTRAINT IF EXISTS chk_dr_to_object_type;
ALTER TABLE document_relations ADD CONSTRAINT chk_dr_to_object_type CHECK (
  to_object_type = ANY(ARRAY[
    'purchase_requisition','purchase_order','purchase_receipt',
    'sales_order','sales_shipment','sales_return',
    'supplier_invoice','sales_invoice',
    'payment_request','payment_record','customer_receipt',
    'contract','work_order','quality_inspection',
    'voucher','budget','fixed_asset'
  ])
);

-- 2. supplier_invoice_items: add FK to purchase_order_items and purchase_receipt_items
ALTER TABLE supplier_invoice_items
  ADD COLUMN IF NOT EXISTS purchase_order_item_id UUID REFERENCES purchase_order_items(id),
  ADD COLUMN IF NOT EXISTS purchase_receipt_item_id UUID REFERENCES purchase_receipt_items(id);

CREATE INDEX IF NOT EXISTS idx_supplier_invoice_items_po_item
  ON supplier_invoice_items(purchase_order_item_id) WHERE purchase_order_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_supplier_invoice_items_receipt_item
  ON supplier_invoice_items(purchase_receipt_item_id) WHERE purchase_receipt_item_id IS NOT NULL;

-- 3. sales_invoice_items: add FK to sales_order_items and sales_shipment_items
ALTER TABLE sales_invoice_items
  ADD COLUMN IF NOT EXISTS sales_order_item_id UUID REFERENCES sales_order_items(id),
  ADD COLUMN IF NOT EXISTS sales_shipment_item_id UUID REFERENCES sales_shipment_items(id);

CREATE INDEX IF NOT EXISTS idx_sales_invoice_items_so_item
  ON sales_invoice_items(sales_order_item_id) WHERE sales_order_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sales_invoice_items_shipment_item
  ON sales_invoice_items(sales_shipment_item_id) WHERE sales_shipment_item_id IS NOT NULL;

-- 4. sales_order_items: add invoiced_quantity tracking (parallel to shipped_quantity)
ALTER TABLE sales_order_items
  ADD COLUMN IF NOT EXISTS invoiced_quantity NUMERIC(15,4) NOT NULL DEFAULT 0;

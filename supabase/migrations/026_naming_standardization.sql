-- 026: Naming standardization
-- Rename inconsistent column names across all line-item tables

-- line_no → line_number (standardize across all tables; rfq_lines already has line_number)
ALTER TABLE purchase_order_items RENAME COLUMN line_no TO line_number;
ALTER TABLE purchase_requisition_lines RENAME COLUMN line_no TO line_number;
ALTER TABLE sales_order_items RENAME COLUMN line_no TO line_number;
ALTER TABLE asn_lines RENAME COLUMN line_no TO line_number;

-- qty → quantity (asn_lines — all other tables already use 'quantity')
ALTER TABLE asn_lines RENAME COLUMN qty TO quantity;

-- is_primary → is_default (supplier_contacts — all other tables already use 'is_default')
ALTER TABLE supplier_contacts RENAME COLUMN is_primary TO is_default;

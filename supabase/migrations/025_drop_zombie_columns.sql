-- 025: Eliminate all remaining migration drift duplicate columns
-- IMPORTANT: Many "duplicate" columns are GENERATED aliases of real columns.
-- We drop the GENERATED aliases and keep the real storage columns.
-- Views that depend on dropped columns are dropped and will be recreated in migration 030.

-- Step 0: Drop views that depend on columns we're about to drop
DROP VIEW IF EXISTS v_stock_summary CASCADE;
DROP VIEW IF EXISTS v_low_stock_alerts CASCADE;

-- 1. customers: drop duplicates (all are real columns, no generated)
ALTER TABLE customers DROP COLUMN IF EXISTS tax_no;
ALTER TABLE customers DROP COLUMN IF EXISTS street;
ALTER TABLE customers DROP COLUMN IF EXISTS customer_type;

-- 2. suppliers: drop duplicate
ALTER TABLE suppliers DROP COLUMN IF EXISTS tax_no;

-- 3. payment_requests: drop GENERATED alias columns (keep real storage columns)
--    Real: ok_to_pay, supplier_invoice_id, request_number, amount
--    Generated aliases: ok_to_pay_flag, invoice_id, payment_request_no, payable_amount
ALTER TABLE payment_requests DROP COLUMN IF EXISTS ok_to_pay_flag;
ALTER TABLE payment_requests DROP COLUMN IF EXISTS invoice_id;
ALTER TABLE payment_requests DROP COLUMN IF EXISTS payment_request_no;
ALTER TABLE payment_requests DROP COLUMN IF EXISTS payable_amount;

-- 4. stock_records: drop GENERATED alias columns (keep real storage columns)
--    Real: quantity, reserved_quantity, product_id
--    Generated aliases: qty_on_hand, qty_reserved, qty_available, available_quantity, item_id
ALTER TABLE stock_records DROP COLUMN IF EXISTS qty_on_hand;
ALTER TABLE stock_records DROP COLUMN IF EXISTS qty_reserved;
ALTER TABLE stock_records DROP COLUMN IF EXISTS qty_available;
ALTER TABLE stock_records DROP COLUMN IF EXISTS available_quantity;
ALTER TABLE stock_records DROP COLUMN IF EXISTS item_id;

-- 5. purchase_order_items: drop denormalized orphan
ALTER TABLE purchase_order_items DROP COLUMN IF EXISTS product_name;

-- 6. Drop duplicate approvals table (only approval_records is used in code)
DROP TABLE IF EXISTS approvals CASCADE;

-- 7. Add back available_quantity as a proper GENERATED column from the real columns
ALTER TABLE stock_records ADD COLUMN available_quantity NUMERIC
  GENERATED ALWAYS AS (quantity - reserved_quantity) STORED;

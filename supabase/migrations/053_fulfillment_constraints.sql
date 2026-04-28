-- 053: Add CHECK constraints to prevent over-fulfillment
-- These constraints are the DB-level safety net; API validates before write.

-- Purchase Order Items: cannot receive or invoice more than ordered
ALTER TABLE purchase_order_items
  ADD CONSTRAINT chk_poi_received_qty CHECK (COALESCE(received_quantity, 0) <= quantity);

ALTER TABLE purchase_order_items
  ADD CONSTRAINT chk_poi_invoiced_qty CHECK (COALESCE(invoiced_quantity, 0) <= quantity);

-- Sales Order Items: cannot ship or invoice more than ordered
ALTER TABLE sales_order_items
  ADD CONSTRAINT chk_soi_shipped_qty CHECK (COALESCE(shipped_quantity, 0) <= quantity);

ALTER TABLE sales_order_items
  ADD CONSTRAINT chk_soi_invoiced_qty CHECK (COALESCE(invoiced_quantity, 0) <= quantity);

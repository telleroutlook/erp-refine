-- 054: Fix GENERATED amount columns on invoice item tables
--
-- Problem: migrations 018 added a new 'quantity' column to these tables without
-- renaming the original 'qty'. The GENERATED 'amount' still references 'qty'
-- (which is NULL/0 since all data goes to 'quantity'). Result: amount=0 always.
--
-- Fix: Drop the broken GENERATED amount, drop orphaned qty, recreate amount
-- from quantity. Also add totals triggers (like PO/SO already have).

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. sales_invoice_items: fix amount generated column
-- ═══════════════════════════════════════════════════════════════════════════════

-- Drop the broken generated column
ALTER TABLE sales_invoice_items DROP COLUMN IF EXISTS amount;

-- Drop the orphaned qty column (data lives in 'quantity' now)
ALTER TABLE sales_invoice_items DROP COLUMN IF EXISTS qty;

-- Recreate amount as generated from quantity (includes discount_rate like SO items)
ALTER TABLE sales_invoice_items
  ADD COLUMN amount NUMERIC(18,2) GENERATED ALWAYS AS (
    ROUND(quantity * unit_price * (1 - COALESCE(discount_rate, 0) / 100), 2)
  ) STORED;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. supplier_invoice_items: fix amount generated column
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE supplier_invoice_items DROP COLUMN IF EXISTS amount;
ALTER TABLE supplier_invoice_items DROP COLUMN IF EXISTS qty;

ALTER TABLE supplier_invoice_items
  ADD COLUMN amount NUMERIC(18,2) GENERATED ALWAYS AS (
    ROUND(quantity * unit_price, 2)
  ) STORED;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. Add auto-calculate totals trigger for sales_invoices (like fn_calc_so_totals)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION fn_calc_sales_invoice_totals()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE sales_invoices
  SET total_amount = COALESCE((
    SELECT SUM(ROUND(quantity * unit_price * (1 - COALESCE(discount_rate, 0) / 100), 2))
    FROM sales_invoice_items
    WHERE sales_invoice_id = COALESCE(NEW.sales_invoice_id, OLD.sales_invoice_id)
      AND deleted_at IS NULL
  ), 0),
  tax_amount = COALESCE((
    SELECT SUM(ROUND(quantity * unit_price * (1 - COALESCE(discount_rate, 0) / 100) * tax_rate / 100, 2))
    FROM sales_invoice_items
    WHERE sales_invoice_id = COALESCE(NEW.sales_invoice_id, OLD.sales_invoice_id)
      AND deleted_at IS NULL
  ), 0)
  WHERE id = COALESCE(NEW.sales_invoice_id, OLD.sales_invoice_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_sales_invoice_items_calc
  AFTER INSERT OR UPDATE OR DELETE ON sales_invoice_items
  FOR EACH ROW EXECUTE FUNCTION fn_calc_sales_invoice_totals();

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. Add auto-calculate totals trigger for supplier_invoices
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION fn_calc_supplier_invoice_totals()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE supplier_invoices
  SET total_amount = COALESCE((
    SELECT SUM(ROUND(quantity * unit_price, 2))
    FROM supplier_invoice_items
    WHERE supplier_invoice_id = COALESCE(NEW.supplier_invoice_id, OLD.supplier_invoice_id)
  ), 0),
  tax_amount = COALESCE((
    SELECT SUM(ROUND(quantity * unit_price * tax_rate / 100, 2))
    FROM supplier_invoice_items
    WHERE supplier_invoice_id = COALESCE(NEW.supplier_invoice_id, OLD.supplier_invoice_id)
  ), 0)
  WHERE id = COALESCE(NEW.supplier_invoice_id, OLD.supplier_invoice_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_supplier_invoice_items_calc
  AFTER INSERT OR UPDATE OR DELETE ON supplier_invoice_items
  FOR EACH ROW EXECUTE FUNCTION fn_calc_supplier_invoice_totals();

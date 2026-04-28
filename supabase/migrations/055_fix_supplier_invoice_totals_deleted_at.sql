-- 055: Fix fn_calc_supplier_invoice_totals missing deleted_at IS NULL filter
--
-- Bug: migration 054 omitted AND deleted_at IS NULL in the supplier invoice
-- totals trigger, causing soft-deleted items to inflate totals.

CREATE OR REPLACE FUNCTION fn_calc_supplier_invoice_totals()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE supplier_invoices
  SET total_amount = COALESCE((
    SELECT SUM(ROUND(quantity * unit_price, 2))
    FROM supplier_invoice_items
    WHERE supplier_invoice_id = COALESCE(NEW.supplier_invoice_id, OLD.supplier_invoice_id)
      AND deleted_at IS NULL
  ), 0),
  tax_amount = COALESCE((
    SELECT SUM(ROUND(quantity * unit_price * tax_rate / 100, 2))
    FROM supplier_invoice_items
    WHERE supplier_invoice_id = COALESCE(NEW.supplier_invoice_id, OLD.supplier_invoice_id)
      AND deleted_at IS NULL
  ), 0)
  WHERE id = COALESCE(NEW.supplier_invoice_id, OLD.supplier_invoice_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

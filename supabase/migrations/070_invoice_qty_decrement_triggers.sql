-- 070: Add symmetric decrement paths to invoice qty triggers
-- Without these, reverting an invoice status leaves invoiced_quantity inflated.

-- 1. Supplier Invoice: increment on draft→verified, decrement on verified→draft/cancelled
CREATE OR REPLACE FUNCTION fn_update_po_invoiced_on_invoice_verify()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'verified' AND OLD.status = 'draft' THEN
    UPDATE purchase_order_items poi
    SET invoiced_quantity = invoiced_quantity + sii.quantity
    FROM supplier_invoice_items sii
    WHERE sii.supplier_invoice_id = NEW.id
      AND sii.purchase_order_item_id = poi.id
      AND sii.purchase_order_item_id IS NOT NULL;
  ELSIF OLD.status = 'verified' AND NEW.status IN ('draft', 'cancelled') THEN
    UPDATE purchase_order_items poi
    SET invoiced_quantity = GREATEST(invoiced_quantity - sii.quantity, 0)
    FROM supplier_invoice_items sii
    WHERE sii.supplier_invoice_id = NEW.id
      AND sii.purchase_order_item_id = poi.id
      AND sii.purchase_order_item_id IS NOT NULL;
  END IF;
  RETURN NEW;
END; $$;

-- 2. Sales Invoice: increment on draft→issued, decrement on issued→draft/cancelled
CREATE OR REPLACE FUNCTION fn_update_so_invoiced_on_invoice_issue()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'issued' AND OLD.status = 'draft' THEN
    UPDATE sales_order_items soi
    SET invoiced_quantity = invoiced_quantity + sii.quantity
    FROM sales_invoice_items sii
    WHERE sii.sales_invoice_id = NEW.id
      AND sii.sales_order_item_id = soi.id
      AND sii.sales_order_item_id IS NOT NULL;
  ELSIF OLD.status = 'issued' AND NEW.status IN ('draft', 'cancelled') THEN
    UPDATE sales_order_items soi
    SET invoiced_quantity = GREATEST(invoiced_quantity - sii.quantity, 0)
    FROM sales_invoice_items sii
    WHERE sii.sales_invoice_id = NEW.id
      AND sii.sales_order_item_id = soi.id
      AND sii.sales_order_item_id IS NOT NULL;
  END IF;
  RETURN NEW;
END; $$;

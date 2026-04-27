-- 051: Triggers to update invoiced_quantity on PO/SO items when invoices are verified/issued
-- Parallel to existing receipt/shipment confirm triggers

-- 1. Supplier Invoice → update purchase_order_items.invoiced_quantity
CREATE OR REPLACE FUNCTION fn_update_po_invoiced_on_invoice_verify()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'verified' AND OLD.status = 'draft' THEN
    -- Update PO items invoiced_quantity via purchase_order_item_id FK
    UPDATE purchase_order_items poi
    SET invoiced_quantity = invoiced_quantity + sii.quantity
    FROM supplier_invoice_items sii
    WHERE sii.supplier_invoice_id = NEW.id
      AND sii.purchase_order_item_id = poi.id
      AND sii.purchase_order_item_id IS NOT NULL;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS tr_supplier_invoice_verify_update_po ON supplier_invoices;
CREATE TRIGGER tr_supplier_invoice_verify_update_po
  AFTER UPDATE ON supplier_invoices
  FOR EACH ROW EXECUTE FUNCTION fn_update_po_invoiced_on_invoice_verify();

-- 2. Sales Invoice → update sales_order_items.invoiced_quantity
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
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS tr_sales_invoice_issue_update_so ON sales_invoices;
CREATE TRIGGER tr_sales_invoice_issue_update_so
  AFTER UPDATE ON sales_invoices
  FOR EACH ROW EXECUTE FUNCTION fn_update_so_invoiced_on_invoice_issue();

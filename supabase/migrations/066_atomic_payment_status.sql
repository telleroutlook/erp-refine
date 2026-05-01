-- Atomic payment status update after customer receipt creation
-- Uses SELECT FOR UPDATE to prevent race conditions from concurrent receipts

CREATE OR REPLACE FUNCTION update_invoice_payment_status(
  p_invoice_id UUID,
  p_organization_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice RECORD;
  v_total_paid NUMERIC;
  v_invoice_payable NUMERIC;
  v_new_status TEXT;
  v_so_id UUID;
  v_total_invoiced NUMERIC;
  v_total_received NUMERIC;
  v_payment_status TEXT;
BEGIN
  -- Lock the invoice row to prevent concurrent status updates
  SELECT id, total_amount, tax_amount, status, sales_order_id
  INTO v_invoice
  FROM sales_invoices
  WHERE id = p_invoice_id
    AND organization_id = p_organization_id
  FOR UPDATE;

  IF v_invoice IS NULL THEN
    RETURN jsonb_build_object('updated', false, 'reason', 'invoice_not_found');
  END IF;

  -- Compute total paid from all non-deleted receipts for this invoice
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_paid
  FROM customer_receipts
  WHERE reference_type = 'sales_invoice'
    AND reference_id = p_invoice_id
    AND organization_id = p_organization_id
    AND deleted_at IS NULL;

  v_invoice_payable := COALESCE(v_invoice.total_amount, 0) + COALESCE(v_invoice.tax_amount, 0);

  -- Only transition to 'paid' when fully paid (sales_invoices has no 'partial' status)
  IF v_total_paid >= v_invoice_payable AND v_invoice_payable > 0 THEN
    v_new_status := 'paid';
  ELSE
    v_new_status := v_invoice.status;
  END IF;

  -- Update invoice status if changed
  IF v_new_status != v_invoice.status AND v_invoice.status IN ('issued', 'overdue') THEN
    UPDATE sales_invoices
    SET status = v_new_status
    WHERE id = p_invoice_id
      AND organization_id = p_organization_id;
  END IF;

  -- Now handle sales order payment_status if linked
  v_so_id := v_invoice.sales_order_id;
  IF v_so_id IS NOT NULL THEN
    -- Sum all invoiced amounts for this SO
    SELECT COALESCE(SUM(total_amount + COALESCE(tax_amount, 0)), 0)
    INTO v_total_invoiced
    FROM sales_invoices
    WHERE sales_order_id = v_so_id
      AND organization_id = p_organization_id
      AND status IN ('issued', 'paid', 'overdue')
      AND deleted_at IS NULL;

    -- Sum all receipts for all invoices of this SO
    SELECT COALESCE(SUM(cr.amount), 0)
    INTO v_total_received
    FROM customer_receipts cr
    INNER JOIN sales_invoices si ON si.id = cr.reference_id
    WHERE cr.reference_type = 'sales_invoice'
      AND si.sales_order_id = v_so_id
      AND cr.organization_id = p_organization_id
      AND cr.deleted_at IS NULL
      AND si.deleted_at IS NULL;

    IF v_total_invoiced > 0 AND v_total_received >= v_total_invoiced THEN
      v_payment_status := 'paid';
    ELSIF v_total_received > 0 THEN
      v_payment_status := 'partial';
    ELSE
      v_payment_status := 'unpaid';
    END IF;

    UPDATE sales_orders
    SET payment_status = v_payment_status
    WHERE id = v_so_id
      AND organization_id = p_organization_id
      AND deleted_at IS NULL;
  END IF;

  RETURN jsonb_build_object(
    'updated', true,
    'invoice_status', v_new_status,
    'order_payment_status', v_payment_status
  );
END;
$$;

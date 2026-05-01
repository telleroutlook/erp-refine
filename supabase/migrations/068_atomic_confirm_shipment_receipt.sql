-- Atomic confirm functions for sales shipments and purchase receipts.
-- Wraps status transition + stock transaction inserts + qty increments
-- in a single transaction to guarantee all-or-nothing.

-- 1. Confirm Sales Shipment (atomically)
CREATE OR REPLACE FUNCTION confirm_sales_shipment(
  p_shipment_id UUID,
  p_org_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shipment RECORD;
  v_item RECORD;
  v_stock_count INT := 0;
BEGIN
  -- Lock the shipment row
  SELECT id, shipment_number, status, warehouse_id, sales_order_id
  INTO v_shipment
  FROM sales_shipments
  WHERE id = p_shipment_id
    AND organization_id = p_org_id
    AND deleted_at IS NULL
  FOR UPDATE;

  IF v_shipment IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'shipment_not_found');
  END IF;

  IF v_shipment.status != 'draft' THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_status', 'current_status', v_shipment.status);
  END IF;

  IF v_shipment.warehouse_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'warehouse_required');
  END IF;

  -- Transition status
  UPDATE sales_shipments
  SET status = 'confirmed',
      confirmed_by = p_user_id,
      confirmed_at = now(),
      updated_at = now()
  WHERE id = p_shipment_id
    AND organization_id = p_org_id;

  -- Create stock transactions (out) for each item
  FOR v_item IN
    SELECT product_id, quantity, sales_order_item_id
    FROM sales_shipment_items
    WHERE sales_shipment_id = p_shipment_id
      AND deleted_at IS NULL
  LOOP
    INSERT INTO stock_transactions (
      organization_id, warehouse_id, product_id, transaction_type,
      quantity, reference_type, reference_id, created_by
    ) VALUES (
      p_org_id, v_shipment.warehouse_id, v_item.product_id, 'out',
      v_item.quantity, 'sales_shipment', p_shipment_id, p_user_id::text
    );
    v_stock_count := v_stock_count + 1;

    -- Increment shipped qty on SO item
    IF v_item.sales_order_item_id IS NOT NULL THEN
      UPDATE sales_order_items
      SET shipped_quantity = COALESCE(shipped_quantity, 0) + v_item.quantity
      WHERE id = v_item.sales_order_item_id;
    END IF;
  END LOOP;

  -- Recompute parent SO status
  IF v_shipment.sales_order_id IS NOT NULL THEN
    PERFORM update_so_status_from_items(v_shipment.sales_order_id, p_org_id);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_shipment.id,
    'shipment_number', v_shipment.shipment_number,
    'status', 'confirmed',
    'stock_transactions_created', v_stock_count
  );
END;
$$;

-- 2. Confirm Purchase Receipt (atomically)
CREATE OR REPLACE FUNCTION confirm_purchase_receipt(
  p_receipt_id UUID,
  p_org_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_receipt RECORD;
  v_item RECORD;
  v_stock_count INT := 0;
BEGIN
  -- Lock the receipt row
  SELECT id, receipt_number, status, warehouse_id, purchase_order_id
  INTO v_receipt
  FROM purchase_receipts
  WHERE id = p_receipt_id
    AND organization_id = p_org_id
    AND deleted_at IS NULL
  FOR UPDATE;

  IF v_receipt IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'receipt_not_found');
  END IF;

  IF v_receipt.status != 'draft' THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_status', 'current_status', v_receipt.status);
  END IF;

  IF v_receipt.warehouse_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'warehouse_required');
  END IF;

  -- Transition status
  UPDATE purchase_receipts
  SET status = 'confirmed',
      confirmed_by = p_user_id,
      confirmed_at = now(),
      updated_at = now()
  WHERE id = p_receipt_id
    AND organization_id = p_org_id;

  -- Create stock transactions (in) for each item
  FOR v_item IN
    SELECT product_id, quantity, lot_number, purchase_order_item_id
    FROM purchase_receipt_items
    WHERE purchase_receipt_id = p_receipt_id
  LOOP
    INSERT INTO stock_transactions (
      organization_id, warehouse_id, product_id, transaction_type,
      quantity, reference_type, reference_id, created_by
    ) VALUES (
      p_org_id, v_receipt.warehouse_id, v_item.product_id, 'in',
      v_item.quantity, 'purchase_receipt', p_receipt_id, p_user_id::text
    );
    v_stock_count := v_stock_count + 1;

    -- Increment received qty on PO item
    IF v_item.purchase_order_item_id IS NOT NULL THEN
      UPDATE purchase_order_items
      SET received_quantity = COALESCE(received_quantity, 0) + v_item.quantity
      WHERE id = v_item.purchase_order_item_id;
    END IF;
  END LOOP;

  -- Recompute parent PO status
  IF v_receipt.purchase_order_id IS NOT NULL THEN
    PERFORM update_po_status_from_items(v_receipt.purchase_order_id, p_org_id);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_receipt.id,
    'receipt_number', v_receipt.receipt_number,
    'status', 'confirmed',
    'stock_transactions_created', v_stock_count
  );
END;
$$;

-- 3. Receive Sales Return (atomically creates stock 'in' transactions)
CREATE OR REPLACE FUNCTION receive_sales_return(
  p_return_id UUID,
  p_org_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_return RECORD;
  v_item RECORD;
  v_stock_count INT := 0;
BEGIN
  -- Lock the return row
  SELECT id, return_number, status, warehouse_id
  INTO v_return
  FROM sales_returns
  WHERE id = p_return_id
    AND organization_id = p_org_id
    AND deleted_at IS NULL
  FOR UPDATE;

  IF v_return IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'return_not_found');
  END IF;

  IF v_return.status != 'approved' THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_status', 'current_status', v_return.status);
  END IF;

  IF v_return.warehouse_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'warehouse_required');
  END IF;

  -- Transition status
  UPDATE sales_returns
  SET status = 'received',
      received_at = now(),
      updated_at = now()
  WHERE id = p_return_id
    AND organization_id = p_org_id;

  -- Create stock transactions (in) for each return item
  FOR v_item IN
    SELECT product_id, quantity
    FROM sales_return_items
    WHERE sales_return_id = p_return_id
      AND deleted_at IS NULL
  LOOP
    INSERT INTO stock_transactions (
      organization_id, warehouse_id, product_id, transaction_type,
      quantity, reference_type, reference_id, created_by
    ) VALUES (
      p_org_id, v_return.warehouse_id, v_item.product_id, 'in',
      v_item.quantity, 'sales_return', p_return_id, p_user_id::text
    );
    v_stock_count := v_stock_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_return.id,
    'return_number', v_return.return_number,
    'status', 'received',
    'stock_transactions_created', v_stock_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION confirm_sales_shipment(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION confirm_purchase_receipt(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION receive_sales_return(UUID, UUID, UUID) TO authenticated;

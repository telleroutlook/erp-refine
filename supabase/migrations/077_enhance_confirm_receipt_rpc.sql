-- Enhance confirm_purchase_receipt RPC to handle quality inspection creation
-- for items that require inspection, making the entire flow atomic.

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
  v_inspections_created INT := 0;
  v_emp_id UUID;
  v_seq_numbers TEXT[];
  v_seq_idx INT := 0;
  v_inspection_items RECORD[];
  v_qi_id UUID;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Lock the receipt row
  SELECT id, receipt_number, status, warehouse_id, purchase_order_id, organization_id
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

  -- Resolve employee_id for the user (for quality inspection created_by)
  SELECT id INTO v_emp_id
  FROM employees
  WHERE user_id = p_user_id
    AND organization_id = p_org_id
  LIMIT 1;

  -- Count inspection items to pre-generate sequence numbers
  SELECT count(*) INTO v_seq_idx
  FROM purchase_receipt_items pri
  JOIN products p ON p.id = pri.product_id
  WHERE pri.purchase_receipt_id = p_receipt_id
    AND p.requires_inspection = true;

  IF v_seq_idx > 0 THEN
    SELECT get_next_sequence_batch(p_org_id, 'quality_inspection', v_seq_idx)
    INTO v_seq_numbers;
  END IF;

  v_seq_idx := 0;

  -- Process each receipt item
  FOR v_item IN
    SELECT pri.id AS item_id, pri.product_id, pri.quantity, pri.lot_number,
           pri.purchase_order_item_id, p.requires_inspection
    FROM purchase_receipt_items pri
    JOIN products p ON p.id = pri.product_id
    WHERE pri.purchase_receipt_id = p_receipt_id
  LOOP
    IF v_item.requires_inspection = true THEN
      -- Create quality inspection instead of stock transaction
      v_seq_idx := v_seq_idx + 1;
      INSERT INTO quality_inspections (
        inspection_number, organization_id, product_id,
        reference_type, reference_id, purchase_receipt_item_id,
        total_quantity, qualified_quantity, defective_quantity,
        inspection_date, status, result, created_by
      ) VALUES (
        v_seq_numbers[v_seq_idx], p_org_id, v_item.product_id,
        'purchase_receipt', p_receipt_id, v_item.item_id,
        v_item.quantity, 0, 0,
        v_today, 'draft', 'pending', v_emp_id
      )
      RETURNING id INTO v_qi_id;

      -- Create document relation
      INSERT INTO document_relations (
        organization_id, from_object_type, from_object_id,
        to_object_type, to_object_id, relation_type, label, metadata
      ) VALUES (
        p_org_id, 'purchase_receipt', p_receipt_id,
        'quality_inspection', v_qi_id, 'derived_from', 'receipt_to_inspection', '{}'::jsonb
      );

      v_inspections_created := v_inspections_created + 1;
    ELSE
      -- Create stock transaction (in) for immediate items
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
    'stock_transactions_created', v_stock_count,
    'inspections_created', v_inspections_created
  );
END;
$$;

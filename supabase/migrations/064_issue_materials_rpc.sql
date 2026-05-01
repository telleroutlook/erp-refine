-- Migration: Atomic material issuance via stored procedure
-- Replaces the 3-step compensating-transaction pattern with a single atomic operation

CREATE OR REPLACE FUNCTION public.issue_work_order_materials(
  p_work_order_id   UUID,
  p_organization_id UUID,
  p_warehouse_id    UUID,
  p_created_by      UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wo_status TEXT;
  v_mat RECORD;
  v_issue_qty NUMERIC;
  v_issued_ids UUID[] := '{}';
BEGIN
  -- Lock work order row to prevent concurrent issuance (FOR UPDATE)
  SELECT status INTO v_wo_status
  FROM work_orders
  WHERE id = p_work_order_id
    AND organization_id = p_organization_id
    AND deleted_at IS NULL
  FOR UPDATE;

  IF v_wo_status IS NULL THEN
    RAISE EXCEPTION 'Work order not found: %', p_work_order_id
      USING ERRCODE = 'P0002';
  END IF;

  IF v_wo_status NOT IN ('released', 'in_progress') THEN
    RAISE EXCEPTION 'Invalid work order status for material issuance: %', v_wo_status
      USING ERRCODE = 'check_violation';
  END IF;

  -- Process each material that needs issuing
  FOR v_mat IN
    SELECT id, product_id, required_quantity, issued_quantity
    FROM work_order_materials
    WHERE work_order_id = p_work_order_id
  LOOP
    v_issue_qty := v_mat.required_quantity - v_mat.issued_quantity;
    IF v_issue_qty <= 0 THEN CONTINUE; END IF;

    -- Insert stock transaction (OUT)
    -- Trigger tr_stock_transaction_update → fn_stock_tx_sync_records → adjust_stock
    -- adjust_stock raises EXCEPTION on insufficient stock, rolling back entire transaction
    INSERT INTO stock_transactions (
      organization_id, warehouse_id, product_id,
      transaction_type, quantity,
      reference_type, reference_id, created_by
    ) VALUES (
      p_organization_id, p_warehouse_id, v_mat.product_id,
      'out', v_issue_qty,
      'production', p_work_order_id, p_created_by
    );

    -- Update issued_quantity on the material row
    UPDATE work_order_materials
    SET issued_quantity = issued_quantity + v_issue_qty
    WHERE id = v_mat.id;

    v_issued_ids := v_issued_ids || v_mat.id;
  END LOOP;

  -- Transition status to in_progress if currently released
  IF v_wo_status = 'released' THEN
    UPDATE work_orders
    SET status = 'in_progress'
    WHERE id = p_work_order_id
      AND organization_id = p_organization_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'issued_material_ids', to_jsonb(v_issued_ids)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.issue_work_order_materials(UUID, UUID, UUID, UUID) TO authenticated;

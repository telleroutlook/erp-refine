-- 015_adjust_stock_rpc.sql
-- Concurrent-safe stock adjustment function using row-level locking

CREATE OR REPLACE FUNCTION adjust_stock(
  p_org_id       UUID,
  p_warehouse_id UUID,
  p_product_id   UUID,
  p_qty_delta    NUMERIC,
  p_reserved_delta NUMERIC DEFAULT 0
) RETURNS stock_records
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_record stock_records;
BEGIN
  -- Try to update existing record with row-level lock
  UPDATE stock_records
  SET
    qty_on_hand    = qty_on_hand + p_qty_delta,
    qty_reserved   = qty_reserved + p_reserved_delta,
    last_movement_at = NOW()
  WHERE organization_id = p_org_id
    AND warehouse_id    = p_warehouse_id
    AND product_id      = p_product_id
  RETURNING * INTO v_record;

  -- If no row updated, insert new record
  IF NOT FOUND THEN
    INSERT INTO stock_records (organization_id, warehouse_id, product_id, qty_on_hand, qty_reserved, last_movement_at)
    VALUES (p_org_id, p_warehouse_id, p_product_id, p_qty_delta, p_reserved_delta, NOW())
    RETURNING * INTO v_record;
  END IF;

  -- Validate: qty_on_hand must not go negative
  IF v_record.qty_on_hand < 0 THEN
    RAISE EXCEPTION 'Insufficient stock: product=%, warehouse=%, available=%, requested=%',
      p_product_id, p_warehouse_id, v_record.qty_on_hand - p_qty_delta, ABS(p_qty_delta)
      USING ERRCODE = 'check_violation';
  END IF;

  -- Validate: qty_reserved must not go negative
  IF v_record.qty_reserved < 0 THEN
    RAISE EXCEPTION 'Insufficient reserved stock: product=%, warehouse=%',
      p_product_id, p_warehouse_id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN v_record;
END;
$$;

-- Grant execute to authenticated users (RLS on stock_records still applies for reads)
GRANT EXECUTE ON FUNCTION adjust_stock(UUID, UUID, UUID, NUMERIC, NUMERIC) TO authenticated;

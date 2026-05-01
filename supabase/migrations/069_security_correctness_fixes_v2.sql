-- Migration 069: Security and correctness fixes
-- Fixes:
--   1. REVOKE exec_query on BOTH signatures (TEXT) and (TEXT, TEXT)
--   2. GRANT EXECUTE on update_invoice_payment_status to authenticated
--   3. Fix adjust_stock to reject withdrawals on non-existent records
--   4. Drop deprecated atomic_increment_shipped_qty (superseded by 052)

-- 1. Revoke exec_query access on single-arg signature (from migration 001)
DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.exec_query(TEXT) FROM PUBLIC;
  REVOKE EXECUTE ON FUNCTION public.exec_query(TEXT) FROM anon;
  REVOKE EXECUTE ON FUNCTION public.exec_query(TEXT) FROM authenticated;
  GRANT EXECUTE ON FUNCTION public.exec_query(TEXT) TO service_role;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

-- Revoke on two-arg signature (live DB has this variant)
DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.exec_query(TEXT, TEXT) FROM PUBLIC;
  REVOKE EXECUTE ON FUNCTION public.exec_query(TEXT, TEXT) FROM anon;
  REVOKE EXECUTE ON FUNCTION public.exec_query(TEXT, TEXT) FROM authenticated;
  GRANT EXECUTE ON FUNCTION public.exec_query(TEXT, TEXT) TO service_role;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

-- 2. Grant execute on update_invoice_payment_status
GRANT EXECUTE ON FUNCTION update_invoice_payment_status(UUID, UUID) TO authenticated;

-- 3. Fix adjust_stock: reject negative delta on non-existent stock record
CREATE OR REPLACE FUNCTION adjust_stock(
  p_org_id UUID,
  p_warehouse_id UUID,
  p_product_id UUID,
  p_qty_delta NUMERIC,
  p_reserved_delta NUMERIC DEFAULT 0
) RETURNS stock_records LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_record stock_records;
BEGIN
  -- Try to update existing record
  UPDATE stock_records
  SET quantity = quantity + p_qty_delta,
      reserved_quantity = reserved_quantity + p_reserved_delta,
      updated_at = now()
  WHERE organization_id = p_org_id
    AND warehouse_id = p_warehouse_id
    AND product_id = p_product_id
  RETURNING * INTO v_record;

  IF NOT FOUND THEN
    -- Cannot withdraw from non-existent stock
    IF p_qty_delta < 0 THEN
      RAISE EXCEPTION 'Insufficient stock: product=%, warehouse=%, available=0, requested=%',
        p_product_id, p_warehouse_id, ABS(p_qty_delta)
        USING ERRCODE = 'check_violation';
    END IF;
    INSERT INTO stock_records (organization_id, warehouse_id, product_id, quantity, reserved_quantity)
    VALUES (p_org_id, p_warehouse_id, p_product_id, p_qty_delta, GREATEST(p_reserved_delta, 0))
    RETURNING * INTO v_record;
  END IF;

  -- Check for negative stock after update
  IF v_record.quantity < 0 THEN
    RAISE EXCEPTION 'Insufficient stock: product=%, warehouse=%, available=%, requested=%',
      p_product_id, p_warehouse_id, v_record.quantity - p_qty_delta, ABS(p_qty_delta)
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN v_record;
END;
$$;

-- 4. Drop deprecated function (superseded by increment_so_shipped_qty in 052)
DROP FUNCTION IF EXISTS atomic_increment_shipped_qty(UUID, NUMERIC);

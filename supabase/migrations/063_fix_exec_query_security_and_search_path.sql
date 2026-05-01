-- Fix exec_query security: migration 062 used wrong function signature (TEXT, TEXT) instead of (TEXT)
-- Also add SET search_path = public to SECURITY DEFINER functions

-- 1. Lock down exec_query(TEXT) — the actual function signature
REVOKE EXECUTE ON FUNCTION public.exec_query(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.exec_query(TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.exec_query(TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.exec_query(TEXT) TO service_role;

-- 2. Recreate update_po_status_from_items with SET search_path = public
CREATE OR REPLACE FUNCTION update_po_status_from_items(
  p_po_id UUID,
  p_org_id UUID
) RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_all_received BOOLEAN;
  v_any_received BOOLEAN;
  v_new_status TEXT;
  v_current_status TEXT;
BEGIN
  SELECT status INTO v_current_status
  FROM purchase_orders
  WHERE id = p_po_id AND organization_id = p_org_id AND deleted_at IS NULL
  FOR UPDATE;

  IF v_current_status IS NULL THEN
    RETURN NULL;
  END IF;

  IF v_current_status NOT IN ('approved', 'partially_received') THEN
    RETURN v_current_status;
  END IF;

  SELECT
    bool_and(COALESCE(received_quantity, 0) >= quantity),
    bool_or(COALESCE(received_quantity, 0) > 0)
  INTO v_all_received, v_any_received
  FROM purchase_order_items
  WHERE purchase_order_id = p_po_id
    AND deleted_at IS NULL;

  IF v_all_received THEN
    v_new_status := 'received';
  ELSIF v_any_received THEN
    v_new_status := 'partially_received';
  ELSE
    RETURN v_current_status;
  END IF;

  UPDATE purchase_orders
  SET status = v_new_status, updated_at = now()
  WHERE id = p_po_id AND organization_id = p_org_id;

  RETURN v_new_status;
END;
$$;

-- 3. Recreate update_so_status_from_items with SET search_path = public
CREATE OR REPLACE FUNCTION update_so_status_from_items(
  p_so_id UUID,
  p_org_id UUID
) RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_all_shipped BOOLEAN;
  v_any_shipped BOOLEAN;
  v_new_status TEXT;
  v_current_status TEXT;
BEGIN
  SELECT status INTO v_current_status
  FROM sales_orders
  WHERE id = p_so_id AND organization_id = p_org_id AND deleted_at IS NULL
  FOR UPDATE;

  IF v_current_status IS NULL THEN
    RETURN NULL;
  END IF;

  IF v_current_status NOT IN ('approved', 'confirmed', 'shipping') THEN
    RETURN v_current_status;
  END IF;

  SELECT
    bool_and(COALESCE(shipped_quantity, 0) >= quantity),
    bool_or(COALESCE(shipped_quantity, 0) > 0)
  INTO v_all_shipped, v_any_shipped
  FROM sales_order_items
  WHERE sales_order_id = p_so_id
    AND deleted_at IS NULL;

  IF v_all_shipped THEN
    v_new_status := 'shipped';
  ELSIF v_any_shipped THEN
    v_new_status := 'shipping';
  ELSE
    RETURN v_current_status;
  END IF;

  UPDATE sales_orders
  SET status = v_new_status, updated_at = now()
  WHERE id = p_so_id AND organization_id = p_org_id;

  RETURN v_new_status;
END;
$$;

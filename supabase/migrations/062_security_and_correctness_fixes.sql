-- Fix critical security and correctness issues found during code review

-- 1. CRITICAL: exec_query allows arbitrary SQL execution by any authenticated user
-- Revoke access from public and restrict to service_role only
REVOKE EXECUTE ON FUNCTION public.exec_query(TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.exec_query(TEXT, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.exec_query(TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.exec_query(TEXT, TEXT) TO service_role;

-- 2. CRITICAL: update_po_status_from_items references non-existent organization_id on purchase_order_items
-- The parent filter (purchase_order_id = p_po_id) already guarantees org isolation
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

-- 3. CRITICAL: update_so_status_from_items references non-existent organization_id on sales_order_items
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

-- 4. Fix RLS policies using non-functional current_setting GUC
DROP POLICY IF EXISTS supplier_contacts_org_isolation ON supplier_contacts;
CREATE POLICY supplier_contacts_org_isolation ON supplier_contacts
  FOR ALL TO authenticated
  USING (organization_id = get_user_org_id());

DROP POLICY IF EXISTS supplier_certificates_org_isolation ON supplier_certificates;
CREATE POLICY supplier_certificates_org_isolation ON supplier_certificates
  FOR ALL TO authenticated
  USING (organization_id = get_user_org_id());

DROP POLICY IF EXISTS profile_change_requests_org_isolation ON profile_change_requests;
CREATE POLICY profile_change_requests_org_isolation ON profile_change_requests
  FOR ALL TO authenticated
  USING (organization_id = get_user_org_id() OR organization_id IS NULL);

-- 5. Fix auth_events INSERT policy allowing cross-tenant writes
DROP POLICY IF EXISTS "auth_events_insert" ON auth_events;
CREATE POLICY "auth_events_insert" ON auth_events
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id());

-- 6. Add missing GRANT EXECUTE for reporting RPCs
GRANT EXECUTE ON FUNCTION rpc_procurement_summary(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_sales_summary_by_month(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_sales_summary_by_customer(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_sales_summary_by_product(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_manufacturing_summary(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_inventory_valuation(UUID, UUID) TO authenticated;

-- 7. Add missing GRANT EXECUTE for atomic_create_with_items
GRANT EXECUTE ON FUNCTION public.atomic_create_with_items(TEXT, TEXT, TEXT, JSONB, JSONB, TEXT, TEXT, BOOLEAN) TO authenticated;

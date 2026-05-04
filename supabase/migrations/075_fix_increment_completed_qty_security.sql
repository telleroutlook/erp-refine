-- Fix security issues in increment_completed_qty:
-- 1. Add SET search_path = public to prevent search_path injection
-- 2. Add organization_id parameter for tenant isolation
-- 3. Add deleted_at IS NULL check
-- 4. REVOKE from PUBLIC, GRANT only to service_role

DROP FUNCTION IF EXISTS public.increment_completed_qty(UUID, INTEGER);

CREATE OR REPLACE FUNCTION public.increment_completed_qty(
  p_work_order_id UUID,
  p_organization_id UUID,
  p_delta INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE work_orders
  SET completed_quantity = COALESCE(completed_quantity, 0) + p_delta,
      updated_at = NOW()
  WHERE id = p_work_order_id
    AND organization_id = p_organization_id
    AND deleted_at IS NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_completed_qty(UUID, UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_completed_qty(UUID, UUID, INTEGER) TO service_role;

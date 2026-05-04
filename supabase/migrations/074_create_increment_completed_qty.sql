-- Create increment_completed_qty function for work_order_productions
-- Used by the manufacturing route to atomically update work_order.completed_quantity
CREATE OR REPLACE FUNCTION public.increment_completed_qty(p_work_order_id UUID, p_delta INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE work_orders
  SET completed_quantity = COALESCE(completed_quantity, 0) + p_delta,
      updated_at = NOW()
  WHERE id = p_work_order_id;
END;
$$;

-- 021_atomic_completed_qty.sql
-- Atomic increment function for work order completed_quantity to avoid TOCTOU race

CREATE OR REPLACE FUNCTION increment_completed_qty(p_work_order_id UUID, p_delta NUMERIC)
RETURNS void AS $$
BEGIN
  UPDATE work_orders
  SET completed_quantity = COALESCE(completed_quantity, 0) + p_delta
  WHERE id = p_work_order_id;
END;
$$ LANGUAGE plpgsql;

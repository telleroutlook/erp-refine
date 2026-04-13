-- Migration 016: Add atomic shipped_qty increment RPC
-- Replaces the racy read-modify-write fallback in the shipment confirmation route.

CREATE OR REPLACE FUNCTION atomic_increment_shipped_qty(
  p_id    UUID,
  p_delta NUMERIC
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE sales_order_items
  SET shipped_qty = shipped_qty + p_delta
  WHERE id = p_id;
$$;

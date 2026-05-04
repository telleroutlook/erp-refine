-- Atomic stock transfer RPC: insert out + in transactions in a single transaction
CREATE OR REPLACE FUNCTION public.transfer_stock(
  p_organization_id UUID,
  p_product_id UUID,
  p_from_warehouse_id UUID,
  p_to_warehouse_id UUID,
  p_quantity INTEGER,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_out_id UUID;
  v_in_id UUID;
BEGIN
  INSERT INTO stock_transactions (organization_id, product_id, warehouse_id, transaction_type, quantity, reference_type, notes)
  VALUES (p_organization_id, p_product_id, p_from_warehouse_id, 'out', p_quantity, 'stock_transfer', p_notes)
  RETURNING id INTO v_out_id;

  INSERT INTO stock_transactions (organization_id, product_id, warehouse_id, transaction_type, quantity, reference_type, notes)
  VALUES (p_organization_id, p_product_id, p_to_warehouse_id, 'in', p_quantity, 'stock_transfer', p_notes)
  RETURNING id INTO v_in_id;

  RETURN jsonb_build_object('out_id', v_out_id, 'in_id', v_in_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.transfer_stock(UUID, UUID, UUID, UUID, INTEGER, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transfer_stock(UUID, UUID, UUID, UUID, INTEGER, TEXT) TO service_role;

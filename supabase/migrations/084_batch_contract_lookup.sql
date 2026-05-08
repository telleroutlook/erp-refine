-- 084: Batch contract lookup for multiple products at once
-- Eliminates N+1 RPC calls during PR→PO conversion

CREATE OR REPLACE FUNCTION find_active_contracts_for_products(
  p_organization_id UUID,
  p_product_ids UUID[],
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  product_id UUID,
  contract_id UUID,
  contract_number TEXT,
  supplier_id UUID,
  unit_price NUMERIC,
  quantity NUMERIC,
  remaining_quantity NUMERIC,
  currency TEXT,
  end_date DATE
)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ci.product_id,
    c.id AS contract_id,
    c.contract_number,
    c.party_id AS supplier_id,
    ci.unit_price,
    ci.quantity,
    ci.quantity - COALESCE(
      (SELECT SUM(poi.quantity)
       FROM purchase_order_items poi
       JOIN purchase_orders po ON po.id = poi.purchase_order_id
       WHERE poi.contract_item_id = ci.id
         AND po.status NOT IN ('cancelled', 'rejected')
         AND po.deleted_at IS NULL),
      0
    ) AS remaining_quantity,
    c.currency,
    c.end_date::DATE
  FROM contracts c
  JOIN contract_items ci ON ci.contract_id = c.id AND ci.deleted_at IS NULL
  WHERE c.organization_id = p_organization_id
    AND c.contract_type = 'procurement'
    AND c.party_type = 'supplier'
    AND c.status = 'active'
    AND c.deleted_at IS NULL
    AND ci.product_id = ANY(p_product_ids)
    AND (c.start_date IS NULL OR c.start_date::DATE <= p_date)
    AND (c.end_date IS NULL OR c.end_date::DATE >= p_date)
  ORDER BY ci.product_id, ci.unit_price ASC;
$$;

COMMENT ON FUNCTION find_active_contracts_for_products IS 'Batch version: find active procurement contracts for multiple products at once. Used during PR→PO conversion to eliminate N+1 queries.';

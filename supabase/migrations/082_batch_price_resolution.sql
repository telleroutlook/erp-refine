-- ============================================================
-- 082: Batch Price Resolution Function
-- Replaces N parallel resolve_price() RPC calls with a single
-- set-returning function that resolves prices for all items at once.
-- ============================================================

CREATE OR REPLACE FUNCTION public.resolve_prices_batch(
  p_organization_id UUID,
  p_items JSONB,  -- [{product_id, quantity, uom_id}]
  p_price_type TEXT,
  p_partner_id UUID DEFAULT NULL,
  p_partner_type TEXT DEFAULT NULL,
  p_date DATE DEFAULT CURRENT_DATE,
  p_currency TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item JSONB;
  v_product_id UUID;
  v_quantity NUMERIC;
  v_uom_id UUID;
  v_results JSONB := '[]'::JSONB;
  v_line RECORD;
  v_conversion_factor NUMERIC(18,6);
  v_fallback_price NUMERIC(18,4);
  v_result JSONB;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity := COALESCE((v_item->>'quantity')::NUMERIC, 1);
    v_uom_id := (v_item->>'uom_id')::UUID;
    v_conversion_factor := 1.0;

    SELECT
      pll.unit_price,
      pll.discount_rate,
      pll.min_quantity,
      pll.uom_id AS line_uom_id,
      pl.id AS price_list_id,
      pl.code AS price_list_code,
      pl.name AS price_list_name,
      pl.currency AS price_list_currency,
      pl.priority,
      pl.partner_id AS pl_partner_id
    INTO v_line
    FROM price_list_lines pll
    JOIN price_lists pl ON pl.id = pll.price_list_id
    WHERE pl.organization_id = p_organization_id
      AND pl.price_type = p_price_type
      AND pl.status = 'active'
      AND pl.deleted_at IS NULL
      AND pll.product_id = v_product_id
      AND pll.deleted_at IS NULL
      AND pl.effective_from <= p_date
      AND (pl.effective_to IS NULL OR pl.effective_to >= p_date)
      AND (pll.effective_from IS NULL OR pll.effective_from <= p_date)
      AND (pll.effective_to IS NULL OR pll.effective_to >= p_date)
      AND pll.min_quantity <= v_quantity
      AND (pll.uom_id IS NULL OR pll.uom_id = v_uom_id)
      AND (
        (pl.partner_id = p_partner_id AND pl.partner_type = p_partner_type)
        OR pl.partner_id IS NULL
      )
    ORDER BY
      (CASE WHEN pl.partner_id IS NOT NULL THEN 0 ELSE 1 END),
      pl.priority ASC,
      pll.min_quantity DESC,
      (CASE WHEN pll.uom_id IS NOT NULL THEN 0 ELSE 1 END)
    LIMIT 1;

    IF FOUND THEN
      IF v_uom_id IS NOT NULL AND v_line.line_uom_id IS NOT NULL AND v_uom_id != v_line.line_uom_id THEN
        SELECT puc.conversion_factor INTO v_conversion_factor
        FROM product_uom_conversions puc
        WHERE puc.organization_id = p_organization_id
          AND (puc.product_id = v_product_id OR puc.product_id IS NULL)
          AND puc.from_uom_id = v_line.line_uom_id
          AND puc.to_uom_id = v_uom_id
          AND puc.is_active = TRUE
          AND puc.deleted_at IS NULL
        ORDER BY puc.product_id NULLS LAST
        LIMIT 1;

        IF v_conversion_factor IS NULL THEN
          v_conversion_factor := 1.0;
        END IF;
      END IF;

      v_result := jsonb_build_object(
        'product_id', v_product_id,
        'found', TRUE,
        'unit_price', ROUND(v_line.unit_price * v_conversion_factor, 4),
        'base_unit_price', v_line.unit_price,
        'discount_rate', COALESCE(v_line.discount_rate, 0),
        'net_price', ROUND(v_line.unit_price * v_conversion_factor * (1 - COALESCE(v_line.discount_rate, 0) / 100), 4),
        'price_list_id', v_line.price_list_id,
        'price_list_code', v_line.price_list_code,
        'price_list_name', v_line.price_list_name,
        'currency', v_line.price_list_currency,
        'min_quantity', v_line.min_quantity,
        'uom_conversion_factor', v_conversion_factor,
        'source', 'price_list'
      );
    ELSE
      SELECT
        CASE p_price_type
          WHEN 'sales' THEN COALESCE(p.sale_price, p.list_price, 0)
          WHEN 'purchase' THEN COALESCE(p.cost_price, p.standard_cost, 0)
        END
      INTO v_fallback_price
      FROM products p
      WHERE p.id = v_product_id;

      v_result := jsonb_build_object(
        'product_id', v_product_id,
        'found', v_fallback_price IS NOT NULL AND v_fallback_price > 0,
        'unit_price', COALESCE(v_fallback_price, 0),
        'base_unit_price', COALESCE(v_fallback_price, 0),
        'discount_rate', 0,
        'net_price', COALESCE(v_fallback_price, 0),
        'price_list_id', NULL,
        'price_list_code', NULL,
        'price_list_name', NULL,
        'currency', p_currency,
        'min_quantity', 1,
        'uom_conversion_factor', 1.0,
        'source', 'product_master'
      );
    END IF;

    v_results := v_results || v_result;
  END LOOP;

  RETURN v_results;
END;
$$;

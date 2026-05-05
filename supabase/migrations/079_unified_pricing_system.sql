-- ============================================================
-- 079: Unified Pricing System
-- Extends price_lists with price_type, partner linkage, priority, UOM support
-- Adds product UOM conversions table
-- Tightens RLS to admin-only for pricing configuration
-- Creates resolve_price() RPC for automated price lookup
-- ============================================================

-- PART 1: Extend price_lists with price_type, priority & partner binding
ALTER TABLE price_lists
  ADD COLUMN IF NOT EXISTS price_type TEXT NOT NULL DEFAULT 'sales' CHECK (price_type IN ('sales', 'purchase')),
  ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS partner_type TEXT CHECK (partner_type IN ('customer', 'supplier')),
  ADD COLUMN IF NOT EXISTS partner_id UUID,
  ADD COLUMN IF NOT EXISTS description TEXT;

CREATE INDEX IF NOT EXISTS idx_price_lists_partner
  ON price_lists(partner_type, partner_id)
  WHERE partner_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_price_lists_priority
  ON price_lists(organization_id, price_type, priority);

-- PART 2: Extend price_list_lines with UOM (effective_from/to already exist)
ALTER TABLE price_list_lines
  ADD COLUMN IF NOT EXISTS uom_id UUID REFERENCES uoms(id);

ALTER TABLE price_list_lines
  DROP CONSTRAINT IF EXISTS uq_price_list_lines;

ALTER TABLE price_list_lines
  ADD CONSTRAINT uq_price_list_lines
  UNIQUE (price_list_id, product_id, min_quantity, uom_id);

-- PART 3: Product UOM conversions
CREATE TABLE IF NOT EXISTS public.product_uom_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  product_id UUID REFERENCES products(id),
  from_uom_id UUID NOT NULL REFERENCES uoms(id),
  to_uom_id UUID NOT NULL REFERENCES uoms(id),
  conversion_factor NUMERIC(18,6) NOT NULL CHECK (conversion_factor > 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, product_id, from_uom_id, to_uom_id),
  CHECK (from_uom_id != to_uom_id)
);

CREATE INDEX IF NOT EXISTS idx_product_uom_conv_org
  ON product_uom_conversions(organization_id);
CREATE INDEX IF NOT EXISTS idx_product_uom_conv_product
  ON product_uom_conversions(product_id)
  WHERE product_id IS NOT NULL;

ALTER TABLE product_uom_conversions ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_product_uom_conv_updated
  BEFORE UPDATE ON product_uom_conversions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- PART 4: Partner default price list linkage
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS default_price_list_id UUID REFERENCES price_lists(id);

ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS default_price_list_id UUID REFERENCES price_lists(id);

-- PART 5: RLS — pricing configuration admin-only
CREATE POLICY "product_uom_conv_read" ON product_uom_conversions
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id());

CREATE POLICY "product_uom_conv_write" ON product_uom_conversions
  FOR ALL TO authenticated
  USING (organization_id = get_user_org_id() AND get_user_role() = 'admin');

DROP POLICY IF EXISTS "price_lists_write" ON price_lists;
CREATE POLICY "price_lists_write" ON price_lists
  FOR ALL TO authenticated
  USING (organization_id = get_user_org_id() AND get_user_role() = 'admin');

DROP POLICY IF EXISTS "price_list_lines_write" ON price_list_lines;
CREATE POLICY "price_list_lines_write" ON price_list_lines
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM price_lists pl
    WHERE pl.id = price_list_id
      AND pl.organization_id = get_user_org_id()
      AND get_user_role() = 'admin'
  ));

-- PART 6: Price resolution function
CREATE OR REPLACE FUNCTION public.resolve_price(
  p_organization_id UUID,
  p_product_id UUID,
  p_price_type TEXT,
  p_partner_id UUID DEFAULT NULL,
  p_partner_type TEXT DEFAULT NULL,
  p_quantity NUMERIC DEFAULT 1,
  p_uom_id UUID DEFAULT NULL,
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
  v_result JSONB;
  v_line RECORD;
  v_conversion_factor NUMERIC(18,6) := 1.0;
  v_fallback_price NUMERIC(18,4);
BEGIN
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
    AND pll.product_id = p_product_id
    AND pll.deleted_at IS NULL
    AND pl.effective_from <= p_date
    AND (pl.effective_to IS NULL OR pl.effective_to >= p_date)
    AND (pll.effective_from IS NULL OR pll.effective_from <= p_date)
    AND (pll.effective_to IS NULL OR pll.effective_to >= p_date)
    AND pll.min_quantity <= p_quantity
    AND (pll.uom_id IS NULL OR pll.uom_id = p_uom_id)
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
    IF p_uom_id IS NOT NULL AND v_line.line_uom_id IS NOT NULL AND p_uom_id != v_line.line_uom_id THEN
      SELECT puc.conversion_factor INTO v_conversion_factor
      FROM product_uom_conversions puc
      WHERE puc.organization_id = p_organization_id
        AND (puc.product_id = p_product_id OR puc.product_id IS NULL)
        AND puc.from_uom_id = v_line.line_uom_id
        AND puc.to_uom_id = p_uom_id
        AND puc.is_active = TRUE
        AND puc.deleted_at IS NULL
      ORDER BY puc.product_id NULLS LAST
      LIMIT 1;

      IF v_conversion_factor IS NULL THEN
        v_conversion_factor := 1.0;
      END IF;
    END IF;

    v_result := jsonb_build_object(
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
    WHERE p.id = p_product_id;

    v_result := jsonb_build_object(
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

  RETURN v_result;
END;
$$;

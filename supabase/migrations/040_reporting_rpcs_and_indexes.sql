-- Server-side aggregation RPCs for reporting tools
-- Replaces client-side 5000-row fetches with efficient GROUP BY queries

-- 1. Procurement summary by status
CREATE OR REPLACE FUNCTION rpc_procurement_summary(
  p_org_id UUID,
  p_from_date DATE DEFAULT NULL,
  p_to_date DATE DEFAULT NULL
)
RETURNS TABLE(status TEXT, order_count BIGINT, total_amount NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT po.status, COUNT(*)::BIGINT, COALESCE(SUM(po.total_amount), 0)
  FROM purchase_orders po
  WHERE po.organization_id = p_org_id
    AND po.deleted_at IS NULL
    AND (p_from_date IS NULL OR po.order_date >= p_from_date)
    AND (p_to_date IS NULL OR po.order_date <= p_to_date)
  GROUP BY po.status;
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. Sales summary by month
CREATE OR REPLACE FUNCTION rpc_sales_summary_by_month(
  p_org_id UUID,
  p_from_date DATE DEFAULT NULL,
  p_to_date DATE DEFAULT NULL
)
RETURNS TABLE(month TEXT, order_count BIGINT, total_amount NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT TO_CHAR(so.order_date, 'YYYY-MM'), COUNT(*)::BIGINT, COALESCE(SUM(so.total_amount), 0)
  FROM sales_orders so
  WHERE so.organization_id = p_org_id
    AND so.deleted_at IS NULL
    AND so.status NOT IN ('cancelled', 'draft')
    AND (p_from_date IS NULL OR so.order_date >= p_from_date)
    AND (p_to_date IS NULL OR so.order_date <= p_to_date)
  GROUP BY TO_CHAR(so.order_date, 'YYYY-MM')
  ORDER BY TO_CHAR(so.order_date, 'YYYY-MM');
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. Sales summary by customer
CREATE OR REPLACE FUNCTION rpc_sales_summary_by_customer(
  p_org_id UUID,
  p_from_date DATE DEFAULT NULL,
  p_to_date DATE DEFAULT NULL
)
RETURNS TABLE(customer_id UUID, customer_name TEXT, order_count BIGINT, total_amount NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.name, COUNT(*)::BIGINT, COALESCE(SUM(so.total_amount), 0)
  FROM sales_orders so
  JOIN customers c ON c.id = so.customer_id
  WHERE so.organization_id = p_org_id
    AND so.deleted_at IS NULL
    AND so.status NOT IN ('cancelled', 'draft')
    AND (p_from_date IS NULL OR so.order_date >= p_from_date)
    AND (p_to_date IS NULL OR so.order_date <= p_to_date)
  GROUP BY c.id, c.name;
END;
$$ LANGUAGE plpgsql STABLE;

-- 4. Sales summary by product
CREATE OR REPLACE FUNCTION rpc_sales_summary_by_product(
  p_org_id UUID,
  p_from_date DATE DEFAULT NULL,
  p_to_date DATE DEFAULT NULL
)
RETURNS TABLE(product_id UUID, product_name TEXT, product_code TEXT, total_qty NUMERIC, total_amount NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.name, p.code,
    COALESCE(SUM(soi.quantity), 0),
    COALESCE(SUM(soi.quantity * soi.unit_price), 0)
  FROM sales_order_items soi
  JOIN sales_orders so ON so.id = soi.sales_order_id
  JOIN products p ON p.id = soi.product_id
  WHERE so.organization_id = p_org_id
    AND so.deleted_at IS NULL
    AND so.status NOT IN ('cancelled', 'draft')
    AND (p_from_date IS NULL OR so.order_date >= p_from_date)
    AND (p_to_date IS NULL OR so.order_date <= p_to_date)
  GROUP BY p.id, p.name, p.code;
END;
$$ LANGUAGE plpgsql STABLE;

-- 5. Manufacturing summary by status
CREATE OR REPLACE FUNCTION rpc_manufacturing_summary(
  p_org_id UUID,
  p_from_date DATE DEFAULT NULL,
  p_to_date DATE DEFAULT NULL
)
RETURNS TABLE(status TEXT, order_count BIGINT, planned_qty NUMERIC, completed_qty NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT wo.status, COUNT(*)::BIGINT,
    COALESCE(SUM(wo.planned_quantity), 0),
    COALESCE(SUM(wo.completed_quantity), 0)
  FROM work_orders wo
  WHERE wo.organization_id = p_org_id
    AND wo.deleted_at IS NULL
    AND (p_from_date IS NULL OR wo.start_date >= p_from_date)
    AND (p_to_date IS NULL OR wo.start_date <= p_to_date)
  GROUP BY wo.status;
END;
$$ LANGUAGE plpgsql STABLE;

-- 6. Inventory valuation summary
CREATE OR REPLACE FUNCTION rpc_inventory_valuation(
  p_org_id UUID,
  p_warehouse_id UUID DEFAULT NULL
)
RETURNS TABLE(total_skus BIGINT, total_qty NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT COUNT(*)::BIGINT, COALESCE(SUM(sr.quantity), 0)
  FROM stock_records sr
  WHERE sr.organization_id = p_org_id
    AND (p_warehouse_id IS NULL OR sr.warehouse_id = p_warehouse_id);
END;
$$ LANGUAGE plpgsql STABLE;

-- 7. Batch sequence generation for import engine
CREATE OR REPLACE FUNCTION get_next_sequence_batch(
  p_organization_id UUID,
  p_sequence_name TEXT,
  p_count INTEGER
)
RETURNS TEXT[] AS $$
DECLARE
  v_results TEXT[];
  v_seq TEXT;
  v_i INTEGER;
BEGIN
  v_results := ARRAY[]::TEXT[];
  FOR v_i IN 1..p_count LOOP
    SELECT get_next_sequence(p_organization_id, p_sequence_name) INTO v_seq;
    v_results := v_results || v_seq;
  END LOOP;
  RETURN v_results;
END;
$$ LANGUAGE plpgsql;

-- 8. Missing composite index for schema_registry
CREATE INDEX IF NOT EXISTS idx_schema_registry_org_status_date
  ON schema_registry(organization_id, status, created_at DESC);

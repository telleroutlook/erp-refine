-- 030: Recreate summary views with correct column names
-- v_stock_summary and v_low_stock_alerts were dropped in 025 due to column dependencies
-- All other views are recreated to match the post-rename schema

CREATE OR REPLACE VIEW v_customer_summary AS
SELECT c.id, c.organization_id, c.code, c.name, c.type, c.credit_limit, c.status,
  count(DISTINCT so.id) AS order_count,
  COALESCE(sum(so.total_amount), 0) AS total_order_amount,
  count(DISTINCT so.id) FILTER (WHERE so.payment_status = 'unpaid') AS unpaid_orders
FROM customers c
LEFT JOIN sales_orders so ON so.customer_id = c.id AND so.deleted_at IS NULL AND so.status <> 'cancelled'
WHERE c.deleted_at IS NULL
GROUP BY c.id;

CREATE OR REPLACE VIEW v_supplier_summary AS
SELECT s.id, s.organization_id, s.code, s.name, s.supplier_type, s.reliability_score, s.status,
  count(DISTINCT po.id) AS order_count,
  COALESCE(sum(po.total_amount), 0) AS total_order_amount,
  count(DISTINCT po.id) FILTER (WHERE po.status IN ('submitted','approved','in_transit')) AS open_orders
FROM suppliers s
LEFT JOIN purchase_orders po ON po.supplier_id = s.id AND po.deleted_at IS NULL AND po.status <> 'cancelled'
WHERE s.deleted_at IS NULL
GROUP BY s.id;

CREATE OR REPLACE VIEW v_purchase_order_summary AS
SELECT po.id, po.organization_id, po.order_number, po.order_date, po.expected_date,
  s.id AS supplier_id, s.name AS supplier_name,
  po.total_amount, po.currency, po.status, po.created_at,
  count(poi.id) AS line_count,
  COALESCE(sum(poi.quantity), 0) AS total_quantity,
  COALESCE(sum(poi.received_quantity), 0) AS total_received
FROM purchase_orders po
LEFT JOIN suppliers s ON s.id = po.supplier_id
LEFT JOIN purchase_order_items poi ON poi.purchase_order_id = po.id AND poi.deleted_at IS NULL
WHERE po.deleted_at IS NULL
GROUP BY po.id, s.id, s.name;

CREATE OR REPLACE VIEW v_sales_order_summary AS
SELECT so.id, so.organization_id, so.order_number, so.order_date, so.delivery_date,
  c.id AS customer_id, c.name AS customer_name,
  so.total_amount, so.currency, so.status, so.payment_status, so.created_at,
  count(soi.id) AS line_count,
  COALESCE(sum(soi.quantity), 0) AS total_quantity,
  COALESCE(sum(soi.shipped_quantity), 0) AS total_shipped
FROM sales_orders so
LEFT JOIN customers c ON c.id = so.customer_id
LEFT JOIN sales_order_items soi ON soi.sales_order_id = so.id AND soi.deleted_at IS NULL
WHERE so.deleted_at IS NULL
GROUP BY so.id, c.id, c.name;

CREATE OR REPLACE VIEW v_stock_summary AS
SELECT sr.id, sr.organization_id, sr.warehouse_id,
  w.name AS warehouse_name, sr.product_id,
  p.code AS product_code, p.name AS product_name, p.unit,
  sr.quantity AS quantity_on_hand,
  sr.reserved_quantity AS quantity_reserved,
  sr.available_quantity AS quantity_available,
  p.min_stock, p.max_stock,
  CASE
    WHEN sr.available_quantity <= 0 THEN 'out_of_stock'
    WHEN sr.available_quantity < p.min_stock THEN 'low_stock'
    WHEN sr.available_quantity > p.max_stock AND p.max_stock > 0 THEN 'over_stock'
    ELSE 'normal'
  END AS stock_status,
  sr.updated_at
FROM stock_records sr
JOIN products p ON p.id = sr.product_id
JOIN warehouses w ON w.id = sr.warehouse_id
WHERE p.deleted_at IS NULL;

CREATE OR REPLACE VIEW v_low_stock_alerts AS
SELECT sr.organization_id, sr.warehouse_id, w.name AS warehouse_name,
  sr.product_id, p.code AS product_code, p.name AS product_name,
  sr.available_quantity, p.min_stock, p.safety_stock_days,
  p.average_daily_consumption,
  CASE
    WHEN sr.available_quantity <= 0 THEN 'critical'
    WHEN p.average_daily_consumption > 0
      AND sr.available_quantity / p.average_daily_consumption < p.safety_stock_days THEN 'warning'
    WHEN sr.available_quantity < p.min_stock THEN 'low'
    ELSE 'ok'
  END AS alert_level,
  CASE
    WHEN p.average_daily_consumption > 0 THEN round(sr.available_quantity / p.average_daily_consumption, 1)
    ELSE NULL
  END AS days_of_stock
FROM stock_records sr
JOIN products p ON p.id = sr.product_id
JOIN warehouses w ON w.id = sr.warehouse_id
WHERE p.deleted_at IS NULL
  AND (sr.available_quantity < p.min_stock OR sr.available_quantity <= 0);

CREATE OR REPLACE VIEW v_pending_approvals AS
SELECT ad.id AS decision_id, ad.organization_id, ad.agent_id, ad.risk_level,
  ad.decision, ad.tools_called, ad.reasoning_summary, ad.confidence, ad.created_at,
  e.name AS requested_by_name
FROM agent_decisions ad
LEFT JOIN agent_sessions asess ON asess.id = ad.session_id
LEFT JOIN employees e ON e.id = asess.user_id
WHERE ad.approval_status = 'pending' AND ad.execution_status = 'pending';

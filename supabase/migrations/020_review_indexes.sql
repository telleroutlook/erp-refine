-- 020_review_indexes.sql
-- Add missing composite and partial indexes identified in code review

-- Partial composite indexes for high-volume soft-delete tables
-- Covers the common query pattern: WHERE organization_id = ? AND deleted_at IS NULL ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_sales_orders_org_active
  ON sales_orders(organization_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_purchase_orders_org_active
  ON purchase_orders(organization_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sales_invoices_org_active
  ON sales_invoices(organization_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_supplier_invoices_org_active
  ON supplier_invoices(organization_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sales_shipments_org_active
  ON sales_shipments(organization_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sales_returns_org_active
  ON sales_returns(organization_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Missing FK index for work_order_productions join
CREATE INDEX IF NOT EXISTS idx_work_order_productions_wo
  ON work_order_productions(work_order_id);

-- Stock records: composite index for list query pattern
CREATE INDEX IF NOT EXISTS idx_stock_records_org_updated
  ON stock_records(organization_id, updated_at DESC);

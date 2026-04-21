-- Add composite (organization_id, created_at DESC) indexes for tables with list queries
-- These support the common pattern: WHERE organization_id = ? ORDER BY created_at DESC

CREATE INDEX IF NOT EXISTS idx_budgets_org_created
  ON budgets (organization_id, created_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_fixed_assets_org_created
  ON fixed_assets (organization_id, created_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_contracts_org_created
  ON contracts (organization_id, created_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_quality_inspections_org_created
  ON quality_inspections (organization_id, created_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_counts_org_created
  ON inventory_counts (organization_id, created_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_approval_records_org_created
  ON approval_records (organization_id, created_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_bom_headers_org_created
  ON bom_headers (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_work_orders_org_created
  ON work_orders (organization_id, created_at DESC);

-- 022_missing_indexes.sql
-- Add composite partial indexes for tables missing from migration 020

CREATE INDEX IF NOT EXISTS idx_purchase_receipts_org_active
  ON purchase_receipts(organization_id, created_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_org_active
  ON purchase_requisitions(organization_id, created_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_rfq_headers_org_active
  ON rfq_headers(organization_id, created_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_supplier_quotations_org_active
  ON supplier_quotations(organization_id, created_at DESC) WHERE deleted_at IS NULL;

-- Composite index for voucher date-range queries
CREATE INDEX IF NOT EXISTS idx_vouchers_org_date
  ON vouchers(organization_id, voucher_date DESC);

-- Composite index for stock transaction time-ordered queries
CREATE INDEX IF NOT EXISTS idx_stock_transactions_org_date
  ON stock_transactions(organization_id, created_at DESC);

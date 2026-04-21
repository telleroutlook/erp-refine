-- 045_trigram_and_composite_indexes.sql
-- Add trigram indexes for text search on commonly filtered columns,
-- and a composite index for customer_receipts payment-sum queries.

-- Trigram indexes (pg_trgm extension already enabled in 001)
CREATE INDEX IF NOT EXISTS idx_employees_name_trgm
  ON employees USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_departments_name_trgm
  ON departments USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_account_subjects_name_trgm
  ON account_subjects USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_work_orders_number_trgm
  ON work_orders USING gin (work_order_number gin_trgm_ops);

-- Composite index for customer_receipts SUM(amount) query scoped by org
CREATE INDEX IF NOT EXISTS idx_customer_receipts_org_reference
  ON customer_receipts (organization_id, reference_type, reference_id)
  WHERE deleted_at IS NULL;

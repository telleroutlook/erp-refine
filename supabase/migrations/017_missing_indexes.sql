-- Performance indexes identified in code review
-- These support high-frequency query patterns that currently lack indexed access paths

-- Customer receipts: payment allocation lookup by reference
CREATE INDEX IF NOT EXISTS idx_customer_receipts_reference
  ON customer_receipts(reference_type, reference_id) WHERE deleted_at IS NULL;

-- Sales invoices: lookup by originating sales order
CREATE INDEX IF NOT EXISTS idx_sales_invoices_sales_order
  ON sales_invoices(sales_order_id);

-- Stock records: composite for common org+product lookup
CREATE INDEX IF NOT EXISTS idx_stock_records_org_product
  ON stock_records(organization_id, product_id);

-- Asset depreciations: lookup by parent asset
CREATE INDEX IF NOT EXISTS idx_asset_depreciations_asset
  ON asset_depreciations(asset_id);

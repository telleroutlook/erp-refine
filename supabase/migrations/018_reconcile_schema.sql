-- Migration 018: Schema Reconciliation
--
-- The actual production database has columns that differ from what migrations 001-016 define.
-- This happened because migration 014 used CREATE TABLE IF NOT EXISTS, and the database
-- was already populated with a different schema (likely from an earlier bootstrapping process).
--
-- This migration documents the ACTUAL database state as of 2026-04-20.
-- All code in src/routes/ and src/tools/ references these actual column names.
-- Future migrations should reference THIS file as the authoritative schema reference.
--
-- Key differences from migration files:
--   suppliers:               contact/phone/email → contact_person/contact_phone/contact_email
--                            extra columns: short_name, tax_no
--   customers:               extra columns: customer_type, street, tax_no
--   products:                extra columns: sku_code, item_type, uom, standard_cost, list_price, is_active, safety_stock
--                            BOTH unit AND uom exist; BOTH status AND is_active exist
--   warehouses:              warehouse_type → type
--   payment_requests:        total_amount → amount; extra: payment_request_no, payable_amount,
--                            ok_to_pay_flag, invoice_id, statement_id
--   vouchers:                description → notes
--   bom_headers:             status → is_active
--   work_orders:             completed_qty → completed_quantity
--   work_order_materials:    required_qty/issued_qty → required_quantity/issued_quantity
--                            extra columns: warehouse_id, status, notes
--   quality_inspections:     total_qty → total_quantity
--   inventory_counts:        initiated_by → created_by
--   three_way_match_results: po_amount/receipt_amount/invoice_amount/variance_amount →
--                            quantity_variance/price_variance/amount_variance/matched_at
--                            CHECK values differ: (pending,matched,partial,mismatch,disputed)
--   customer_receipts:       sales_invoice_id FK → reference_type/reference_id polymorphic
--   *_items tables:          qty → quantity (sales_order_items, sales_invoice_items,
--                            sales_return_items, purchase_receipt_items,
--                            supplier_invoice_items, stock_transactions)
--   customer_addresses:      street/phone → address/contact_phone/contact_name
--   supplier_sites:          extra columns: province, postal_code, contact_name,
--                            contact_phone, is_active
--   inventory_count_lines:   counted_qty/system_qty/variance_qty →
--                            counted_quantity/system_quantity/variance_quantity
--
-- HOW TO READ THIS FILE:
--   COMMENT ON TABLE/COLUMN statements are purely documentation — they do NOT alter data.
--   ADD COLUMN IF NOT EXISTS guards ensure this file is safe on both fresh and production DBs.
--   Any column that production already has (but 001-016 omit) is added here so that fresh
--   DB installs match production schema.
-- ---------------------------------------------------------------------------

-- ===========================================================================
-- suppliers
-- ===========================================================================
-- Migration 003 defines: contact, phone, email
-- Production DB has:     contact_person, contact_phone, contact_email, short_name, tax_no

COMMENT ON TABLE public.suppliers IS
  'Suppliers master data. ACTUAL COLUMN NAMES differ from migration 003: '
  'contact_person (not contact), contact_phone (not phone), contact_email (not email). '
  'Extra production columns: short_name, tax_no.';

ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS contact_person  TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone   TEXT,
  ADD COLUMN IF NOT EXISTS contact_email   TEXT,
  ADD COLUMN IF NOT EXISTS short_name      TEXT,
  ADD COLUMN IF NOT EXISTS tax_no          TEXT;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'suppliers' AND column_name = 'contact_person'
  ) THEN
    COMMENT ON COLUMN public.suppliers.contact_person IS
      'Primary contact name. ACTUAL column name in production (migration 003 defines it as "contact").';
    COMMENT ON COLUMN public.suppliers.contact_phone IS
      'Primary contact phone. ACTUAL column name in production (migration 003 defines it as "phone").';
    COMMENT ON COLUMN public.suppliers.contact_email IS
      'Primary contact email. ACTUAL column name in production (migration 003 defines it as "email").';
    COMMENT ON COLUMN public.suppliers.short_name IS
      'Short / abbreviated supplier name. Not in migration 003; added in production bootstrapping.';
    COMMENT ON COLUMN public.suppliers.tax_no IS
      'Supplier tax registration number. Not in migration 003; added in production bootstrapping.';
  END IF;
END $$;

-- ===========================================================================
-- customers
-- ===========================================================================
-- Migration 003 defines: contact, phone, email, street, customer_type
-- Production DB has:     same, plus extra tax_no column (tax_number in migration)

COMMENT ON TABLE public.customers IS
  'Customers master data. Production DB has extra column tax_no '
  '(migration 003 calls the equivalent field tax_number).';

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS tax_no TEXT;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'tax_no'
  ) THEN
    COMMENT ON COLUMN public.customers.tax_no IS
      'Customer tax registration number. Production column name is "tax_no"; '
      'migration 003 uses "tax_number" for the same intent.';
  END IF;
END $$;

-- ===========================================================================
-- products
-- ===========================================================================
-- Migration 003 defines: unit, status, cost_price, list_price, safety_stock_days
-- Production DB has:     BOTH unit AND uom; BOTH status AND is_active
--                        Extra: sku_code, item_type, standard_cost, safety_stock

COMMENT ON TABLE public.products IS
  'Products / SKU master data. Production has BOTH unit AND uom columns, and BOTH '
  'status AND is_active columns. Extra production columns: sku_code, item_type, '
  'standard_cost, safety_stock. Routes and tools use the actual production column names.';

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sku_code       TEXT,
  ADD COLUMN IF NOT EXISTS item_type      TEXT,
  ADD COLUMN IF NOT EXISTS uom            TEXT,
  ADD COLUMN IF NOT EXISTS standard_cost  NUMERIC(18,4),
  ADD COLUMN IF NOT EXISTS is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS safety_stock   NUMERIC(18,4);

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'sku_code'
  ) THEN
    COMMENT ON COLUMN public.products.sku_code IS
      'SKU code. Production-only column; migration 003 uses "code" as the primary identifier.';
    COMMENT ON COLUMN public.products.item_type IS
      'Item type classification. Production-only column; migration 003 uses "type".';
    COMMENT ON COLUMN public.products.uom IS
      'Unit of measure. Production has BOTH uom AND unit; routes prefer uom.';
    COMMENT ON COLUMN public.products.unit IS
      'Base unit. Migration 003 primary column. Production also has "uom"; prefer uom in new code.';
    COMMENT ON COLUMN public.products.standard_cost IS
      'Standard costing price. Production-only; migration 003 uses cost_price.';
    COMMENT ON COLUMN public.products.is_active IS
      'Active flag. Production has BOTH is_active AND status. Use is_active for boolean checks.';
    COMMENT ON COLUMN public.products.status IS
      'Status text (active/inactive/discontinued). Production has BOTH status AND is_active.';
    COMMENT ON COLUMN public.products.safety_stock IS
      'Safety stock quantity. Production column name; migration 003 uses safety_stock_days (integer).';
  END IF;
END $$;

-- ===========================================================================
-- warehouses
-- ===========================================================================
-- Migration 003 defines: warehouse_type
-- Production DB has:     type   (not warehouse_type)

COMMENT ON TABLE public.warehouses IS
  'Warehouse master data. CRITICAL: production column is "type", NOT "warehouse_type" '
  'as defined in migration 003. All routes/tools use "type".';

ALTER TABLE public.warehouses
  ADD COLUMN IF NOT EXISTS type TEXT;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'warehouses' AND column_name = 'type'
  ) THEN
    COMMENT ON COLUMN public.warehouses.type IS
      'Warehouse type. ACTUAL production column name. '
      'Migration 003 defines this as "warehouse_type" — that column does NOT exist in production.';
  END IF;
END $$;

-- ===========================================================================
-- payment_requests
-- ===========================================================================
-- Migration 005 defines: total_amount, ok_to_pay (BOOLEAN)
-- Production DB has:     amount (not total_amount), ok_to_pay_flag (not ok_to_pay)
--                        Extra: payment_request_no, payable_amount, invoice_id, statement_id

COMMENT ON TABLE public.payment_requests IS
  'Payment requests (AP). ACTUAL column names differ from migration 005: '
  '"amount" (not total_amount), "ok_to_pay_flag" (not ok_to_pay). '
  'Extra production columns: payment_request_no, payable_amount, invoice_id, statement_id. '
  'CLAUDE.md canonical reference: ok_to_pay (BOOLEAN) — actual DB column is ok_to_pay_flag.';

ALTER TABLE public.payment_requests
  ADD COLUMN IF NOT EXISTS amount              NUMERIC(18,2),
  ADD COLUMN IF NOT EXISTS ok_to_pay_flag      BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS payment_request_no  TEXT,
  ADD COLUMN IF NOT EXISTS payable_amount      NUMERIC(18,2),
  ADD COLUMN IF NOT EXISTS invoice_id          UUID,
  ADD COLUMN IF NOT EXISTS statement_id        UUID;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payment_requests' AND column_name = 'amount'
  ) THEN
    COMMENT ON COLUMN public.payment_requests.amount IS
      'Payment amount. ACTUAL production column. Migration 005 defines it as "total_amount".';
    COMMENT ON COLUMN public.payment_requests.ok_to_pay_flag IS
      'Approval flag. ACTUAL production column. Migration 005 defines it as "ok_to_pay".';
    COMMENT ON COLUMN public.payment_requests.payment_request_no IS
      'Payment request number (alternate). Production-only column.';
    COMMENT ON COLUMN public.payment_requests.payable_amount IS
      'Net payable amount after deductions. Production-only column.';
    COMMENT ON COLUMN public.payment_requests.invoice_id IS
      'Direct invoice reference. Production-only column.';
    COMMENT ON COLUMN public.payment_requests.statement_id IS
      'Statement reference. Production-only column.';
  END IF;
END $$;

-- ===========================================================================
-- vouchers
-- ===========================================================================
-- Migration 007 defines: description
-- Production DB has:     notes   (not description)

COMMENT ON TABLE public.vouchers IS
  'Accounting vouchers / journal entries. ACTUAL production column is "notes", '
  'NOT "description" as defined in migration 007.';

ALTER TABLE public.vouchers
  ADD COLUMN IF NOT EXISTS notes TEXT;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vouchers' AND column_name = 'notes'
  ) THEN
    COMMENT ON COLUMN public.vouchers.notes IS
      'Voucher narrative / memo. ACTUAL production column name. '
      'Migration 007 defines it as "description".';
  END IF;
END $$;

-- ===========================================================================
-- bom_headers
-- ===========================================================================
-- Migration 008 defines: status TEXT ('draft','active','obsolete')
-- Production DB has:     is_active BOOLEAN   (not status)

COMMENT ON TABLE public.bom_headers IS
  'Bill of Materials headers. ACTUAL production column is "is_active" (BOOLEAN), '
  'NOT "status" as defined in migration 008.';

ALTER TABLE public.bom_headers
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bom_headers' AND column_name = 'is_active'
  ) THEN
    COMMENT ON COLUMN public.bom_headers.is_active IS
      'Active/inactive flag. ACTUAL production column. '
      'Migration 008 uses "status" TEXT with (draft,active,obsolete) check — '
      'that column does NOT exist in production.';
  END IF;
END $$;

-- ===========================================================================
-- work_orders
-- ===========================================================================
-- Migration 008 defines: completed_qty
-- Production DB has:     completed_quantity

COMMENT ON TABLE public.work_orders IS
  'Manufacturing work orders. ACTUAL production column is "completed_quantity", '
  'NOT "completed_qty" as defined in migration 008.';

ALTER TABLE public.work_orders
  ADD COLUMN IF NOT EXISTS completed_quantity NUMERIC(18,4) NOT NULL DEFAULT 0;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'work_orders' AND column_name = 'completed_quantity'
  ) THEN
    COMMENT ON COLUMN public.work_orders.completed_quantity IS
      'Completed production quantity. ACTUAL production column name. '
      'Migration 008 defines it as "completed_qty".';
  END IF;
END $$;

-- ===========================================================================
-- work_order_materials
-- ===========================================================================
-- Migration 008 defines: required_qty, issued_qty
-- Production DB has:     required_quantity, issued_quantity
--                        Extra: warehouse_id, status, notes

COMMENT ON TABLE public.work_order_materials IS
  'Materials issued to work orders. ACTUAL column names: required_quantity (not required_qty), '
  'issued_quantity (not issued_qty). Extra production columns: warehouse_id, status, notes.';

ALTER TABLE public.work_order_materials
  ADD COLUMN IF NOT EXISTS required_quantity  NUMERIC(18,4),
  ADD COLUMN IF NOT EXISTS issued_quantity    NUMERIC(18,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS warehouse_id       UUID,
  ADD COLUMN IF NOT EXISTS status             TEXT,
  ADD COLUMN IF NOT EXISTS notes              TEXT;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'work_order_materials' AND column_name = 'required_quantity'
  ) THEN
    COMMENT ON COLUMN public.work_order_materials.required_quantity IS
      'Required quantity. ACTUAL production column. Migration 008 uses "required_qty".';
    COMMENT ON COLUMN public.work_order_materials.issued_quantity IS
      'Issued quantity. ACTUAL production column. Migration 008 uses "issued_qty".';
    COMMENT ON COLUMN public.work_order_materials.warehouse_id IS
      'Source warehouse. Production-only column.';
    COMMENT ON COLUMN public.work_order_materials.status IS
      'Issue status. Production-only column.';
    COMMENT ON COLUMN public.work_order_materials.notes IS
      'Free-text notes. Production-only column.';
  END IF;
END $$;

-- ===========================================================================
-- quality_inspections
-- ===========================================================================
-- Migration 009 defines: total_qty
-- Production DB has:     total_quantity

COMMENT ON TABLE public.quality_inspections IS
  'Quality inspection records. ACTUAL production column is "total_quantity", '
  'NOT "total_qty" as defined in migration 009.';

ALTER TABLE public.quality_inspections
  ADD COLUMN IF NOT EXISTS total_quantity NUMERIC(18,4);

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quality_inspections' AND column_name = 'total_quantity'
  ) THEN
    COMMENT ON COLUMN public.quality_inspections.total_quantity IS
      'Total inspection quantity. ACTUAL production column. Migration 009 uses "total_qty".';
  END IF;
END $$;

-- ===========================================================================
-- inventory_counts
-- ===========================================================================
-- Migration 004 defines: initiated_by UUID
-- Production DB has:     created_by UUID   (not initiated_by)

COMMENT ON TABLE public.inventory_counts IS
  'Inventory / cycle count sessions. ACTUAL production column is "created_by", '
  'NOT "initiated_by" as defined in migration 004.';

ALTER TABLE public.inventory_counts
  ADD COLUMN IF NOT EXISTS created_by UUID;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'inventory_counts' AND column_name = 'created_by'
  ) THEN
    COMMENT ON COLUMN public.inventory_counts.created_by IS
      'Employee who initiated the count. ACTUAL production column. '
      'Migration 004 defines it as "initiated_by".';
  END IF;
END $$;

-- ===========================================================================
-- three_way_match_results
-- ===========================================================================
-- Migration 005 defines: po_amount, receipt_amount, invoice_amount, variance_amount
--                        CHECK (pending,matched,price_variance,qty_variance,exception)
-- Production DB has:     quantity_variance, price_variance, amount_variance, matched_at
--                        CHECK (pending,matched,partial,mismatch,disputed)

COMMENT ON TABLE public.three_way_match_results IS
  'Three-way PO/receipt/invoice matching results. ACTUAL production columns differ entirely '
  'from migration 005. Actual: quantity_variance, price_variance, amount_variance, matched_at. '
  'Migration 005 defines: po_amount, receipt_amount, invoice_amount, variance_amount. '
  'match_status CHECK constraint also differs: production allows '
  '(pending,matched,partial,mismatch,disputed) vs migration (pending,matched,price_variance,qty_variance,exception).';

ALTER TABLE public.three_way_match_results
  ADD COLUMN IF NOT EXISTS quantity_variance  NUMERIC(18,4),
  ADD COLUMN IF NOT EXISTS price_variance     NUMERIC(18,4),
  ADD COLUMN IF NOT EXISTS amount_variance    NUMERIC(18,2),
  ADD COLUMN IF NOT EXISTS matched_at         TIMESTAMPTZ;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'three_way_match_results' AND column_name = 'quantity_variance'
  ) THEN
    COMMENT ON COLUMN public.three_way_match_results.quantity_variance IS
      'Quantity discrepancy between PO, receipt, and invoice. ACTUAL production column. '
      'Migration 005 uses: po_amount/receipt_amount/invoice_amount/variance_amount.';
    COMMENT ON COLUMN public.three_way_match_results.price_variance IS
      'Unit price discrepancy. ACTUAL production column.';
    COMMENT ON COLUMN public.three_way_match_results.amount_variance IS
      'Total amount discrepancy. ACTUAL production column.';
    COMMENT ON COLUMN public.three_way_match_results.matched_at IS
      'Timestamp when match was resolved. ACTUAL production column.';
  END IF;
END $$;

-- ===========================================================================
-- customer_receipts
-- ===========================================================================
-- Migration 006 defines: sales_invoice_id UUID FK → sales_invoices
-- Production DB has:     reference_type TEXT, reference_id UUID  (polymorphic)

COMMENT ON TABLE public.customer_receipts IS
  'Customer payment receipts (AR). ACTUAL production schema uses polymorphic reference '
  '(reference_type + reference_id) instead of the direct sales_invoice_id FK '
  'defined in migration 006. This allows receipts to reference invoices, orders, or other docs.';

ALTER TABLE public.customer_receipts
  ADD COLUMN IF NOT EXISTS reference_type TEXT,
  ADD COLUMN IF NOT EXISTS reference_id   UUID;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customer_receipts' AND column_name = 'reference_type'
  ) THEN
    COMMENT ON COLUMN public.customer_receipts.reference_type IS
      'Polymorphic reference type (e.g. "sales_invoice", "sales_order"). ACTUAL production column. '
      'Migration 006 uses a direct sales_invoice_id FK instead.';
    COMMENT ON COLUMN public.customer_receipts.reference_id IS
      'Polymorphic reference ID. ACTUAL production column. '
      'Migration 006 uses a direct sales_invoice_id FK instead.';
  END IF;
END $$;

-- ===========================================================================
-- sales_order_items  — qty → quantity
-- ===========================================================================
COMMENT ON TABLE public.sales_order_items IS
  'Line items on sales orders. ACTUAL production column is "quantity", NOT "qty" as in migration 006.';

ALTER TABLE public.sales_order_items
  ADD COLUMN IF NOT EXISTS quantity NUMERIC(18,4);

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales_order_items' AND column_name = 'quantity'
  ) THEN
    COMMENT ON COLUMN public.sales_order_items.quantity IS
      'Ordered quantity. ACTUAL production column name. Migration 006 uses "qty".';
  END IF;
END $$;

-- ===========================================================================
-- sales_invoice_items  — qty → quantity
-- ===========================================================================
COMMENT ON TABLE public.sales_invoice_items IS
  'Line items on sales invoices. ACTUAL production column is "quantity", NOT "qty" as in migration 006.';

ALTER TABLE public.sales_invoice_items
  ADD COLUMN IF NOT EXISTS quantity NUMERIC(18,4);

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales_invoice_items' AND column_name = 'quantity'
  ) THEN
    COMMENT ON COLUMN public.sales_invoice_items.quantity IS
      'Invoiced quantity. ACTUAL production column name. Migration 006 uses "qty".';
  END IF;
END $$;

-- ===========================================================================
-- sales_return_items  — qty → quantity
-- ===========================================================================
COMMENT ON TABLE public.sales_return_items IS
  'Line items on sales returns. ACTUAL production column is "quantity", NOT "qty" as in migration 006.';

ALTER TABLE public.sales_return_items
  ADD COLUMN IF NOT EXISTS quantity NUMERIC(18,4);

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales_return_items' AND column_name = 'quantity'
  ) THEN
    COMMENT ON COLUMN public.sales_return_items.quantity IS
      'Returned quantity. ACTUAL production column name. Migration 006 uses "qty".';
  END IF;
END $$;

-- ===========================================================================
-- purchase_receipt_items  — qty → quantity
-- ===========================================================================
COMMENT ON TABLE public.purchase_receipt_items IS
  'Line items on purchase receipts (GRN). ACTUAL production column is "quantity", NOT "qty" as in migration 005.';

ALTER TABLE public.purchase_receipt_items
  ADD COLUMN IF NOT EXISTS quantity NUMERIC(18,4);

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'purchase_receipt_items' AND column_name = 'quantity'
  ) THEN
    COMMENT ON COLUMN public.purchase_receipt_items.quantity IS
      'Received quantity. ACTUAL production column name. Migration 005 uses "qty".';
  END IF;
END $$;

-- ===========================================================================
-- supplier_invoice_items  — qty → quantity
-- ===========================================================================
COMMENT ON TABLE public.supplier_invoice_items IS
  'Line items on supplier (AP) invoices. ACTUAL production column is "quantity", NOT "qty" as in migration 005.';

ALTER TABLE public.supplier_invoice_items
  ADD COLUMN IF NOT EXISTS quantity NUMERIC(18,4);

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'supplier_invoice_items' AND column_name = 'quantity'
  ) THEN
    COMMENT ON COLUMN public.supplier_invoice_items.quantity IS
      'Invoiced quantity. ACTUAL production column name. Migration 005 uses "qty".';
  END IF;
END $$;

-- ===========================================================================
-- stock_transactions  — qty → quantity
-- ===========================================================================
COMMENT ON TABLE public.stock_transactions IS
  'Immutable inventory movement audit trail. ACTUAL production column is "quantity", NOT "qty" as in migration 004.';

ALTER TABLE public.stock_transactions
  ADD COLUMN IF NOT EXISTS quantity NUMERIC(18,4);

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'stock_transactions' AND column_name = 'quantity'
  ) THEN
    COMMENT ON COLUMN public.stock_transactions.quantity IS
      'Movement quantity (positive=in, negative=out). ACTUAL production column. Migration 004 uses "qty".';
  END IF;
END $$;

-- ===========================================================================
-- customer_addresses
-- ===========================================================================
-- Migration 003 defines: street TEXT NOT NULL, phone TEXT
-- Production DB has:     address TEXT, contact_phone TEXT, contact_name TEXT

COMMENT ON TABLE public.customer_addresses IS
  'Customer delivery / billing addresses. ACTUAL production columns: '
  '"address" (not "street"), "contact_phone" (not "phone"), plus extra "contact_name". '
  'Migration 003 defines street NOT NULL; production uses address (nullable).';

ALTER TABLE public.customer_addresses
  ADD COLUMN IF NOT EXISTS address       TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS contact_name  TEXT;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customer_addresses' AND column_name = 'address'
  ) THEN
    COMMENT ON COLUMN public.customer_addresses.address IS
      'Full address text. ACTUAL production column. Migration 003 defines this as "street".';
    COMMENT ON COLUMN public.customer_addresses.contact_phone IS
      'Contact phone number. ACTUAL production column. Migration 003 defines this as "phone".';
    COMMENT ON COLUMN public.customer_addresses.contact_name IS
      'Contact person name. Production-only column. Migration 003 does not include this.';
  END IF;
END $$;

-- ===========================================================================
-- supplier_sites
-- ===========================================================================
-- Migration 003 defines: site_code, site_name, address, city, country, is_primary
-- Production DB has all of those PLUS: province, postal_code, contact_name,
--                                       contact_phone, is_active

COMMENT ON TABLE public.supplier_sites IS
  'Supplier delivery / billing sites. Production has all columns from migration 003 '
  'plus extra: province, postal_code, contact_name, contact_phone, is_active.';

ALTER TABLE public.supplier_sites
  ADD COLUMN IF NOT EXISTS province      TEXT,
  ADD COLUMN IF NOT EXISTS postal_code   TEXT,
  ADD COLUMN IF NOT EXISTS contact_name  TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS is_active     BOOLEAN NOT NULL DEFAULT TRUE;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'supplier_sites' AND column_name = 'province'
  ) THEN
    COMMENT ON COLUMN public.supplier_sites.province IS
      'Province / state. Production-only column; not in migration 003.';
    COMMENT ON COLUMN public.supplier_sites.postal_code IS
      'Postal / zip code. Production-only column; not in migration 003.';
    COMMENT ON COLUMN public.supplier_sites.contact_name IS
      'Site contact person. Production-only column; not in migration 003.';
    COMMENT ON COLUMN public.supplier_sites.contact_phone IS
      'Site contact phone. Production-only column; not in migration 003.';
    COMMENT ON COLUMN public.supplier_sites.is_active IS
      'Active flag. Production-only column; not in migration 003.';
  END IF;
END $$;

-- ===========================================================================
-- inventory_count_lines
-- ===========================================================================
-- Migration 004 defines: counted_qty, system_qty, variance_qty (GENERATED)
-- Production DB has:     counted_quantity, system_quantity, variance_quantity

COMMENT ON TABLE public.inventory_count_lines IS
  'Individual lines within an inventory count session. ACTUAL production column names: '
  'counted_quantity, system_quantity, variance_quantity. '
  'Migration 004 uses: counted_qty, system_qty, variance_qty.';

ALTER TABLE public.inventory_count_lines
  ADD COLUMN IF NOT EXISTS counted_quantity   NUMERIC(18,4),
  ADD COLUMN IF NOT EXISTS system_quantity    NUMERIC(18,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS variance_quantity  NUMERIC(18,4);

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'inventory_count_lines' AND column_name = 'counted_quantity'
  ) THEN
    COMMENT ON COLUMN public.inventory_count_lines.counted_quantity IS
      'Physically counted quantity. ACTUAL production column. Migration 004 uses "counted_qty".';
    COMMENT ON COLUMN public.inventory_count_lines.system_quantity IS
      'System (book) quantity at time of count. ACTUAL production column. Migration 004 uses "system_qty".';
    COMMENT ON COLUMN public.inventory_count_lines.variance_quantity IS
      'Variance = counted - system. ACTUAL production column. '
      'Migration 004 defines this as GENERATED ALWAYS AS (counted_qty - system_qty); '
      'production stores it as a plain column.';
  END IF;
END $$;

-- ===========================================================================
-- End of reconciliation
-- ===========================================================================
-- Summary: 17 tables reconciled. This migration is idempotent (IF NOT EXISTS guards).
-- Run on fresh DB: adds all production-only columns so the schema matches production.
-- Run on production DB: all ADD COLUMN IF NOT EXISTS are no-ops; COMMENTs are applied.

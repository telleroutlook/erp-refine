-- Migration drift reconciliation
-- Problem: Migrations 005/007 and 014 create conflicting schemas for several tables
-- via CREATE TABLE IF NOT EXISTS. On fresh installs running all migrations sequentially,
-- the earlier migration (005/007) creates the table and 014's version is a no-op.
-- This migration ensures all tables match the production schema regardless of creation order.

-- rfq_lines: ensure column names match production (014 schema)
DO $$ BEGIN
  -- If rfq_header_id exists (from 005) but rfq_id doesn't (from 014), rename it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'rfq_lines' AND column_name = 'rfq_header_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'rfq_lines' AND column_name = 'rfq_id'
  ) THEN
    ALTER TABLE rfq_lines RENAME COLUMN rfq_header_id TO rfq_id;
  END IF;

  -- Add description if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'rfq_lines' AND column_name = 'description'
  ) THEN
    ALTER TABLE rfq_lines ADD COLUMN description TEXT NOT NULL DEFAULT '';
  END IF;

  -- Add unit_of_measure if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'rfq_lines' AND column_name = 'unit_of_measure'
  ) THEN
    ALTER TABLE rfq_lines ADD COLUMN unit_of_measure TEXT;
  END IF;

  -- Rename qty to qty_requested if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'rfq_lines' AND column_name = 'qty'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'rfq_lines' AND column_name = 'qty_requested'
  ) THEN
    ALTER TABLE rfq_lines RENAME COLUMN qty TO qty_requested;
  END IF;
END $$;

-- budgets: ensure column names match production (014 schema)
DO $$ BEGIN
  -- Rename name to budget_name if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'budgets' AND column_name = 'name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'budgets' AND column_name = 'budget_name'
  ) THEN
    ALTER TABLE budgets RENAME COLUMN name TO budget_name;
  END IF;

  -- Rename fiscal_year to budget_year if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'budgets' AND column_name = 'fiscal_year'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'budgets' AND column_name = 'budget_year'
  ) THEN
    ALTER TABLE budgets RENAME COLUMN fiscal_year TO budget_year;
  END IF;

  -- Add budget_type if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'budgets' AND column_name = 'budget_type'
  ) THEN
    ALTER TABLE budgets ADD COLUMN budget_type TEXT NOT NULL DEFAULT 'annual'
      CHECK (budget_type IN ('annual', 'quarterly', 'monthly', 'project'));
  END IF;
END $$;

-- budget_lines: ensure column names match production (014 schema)
DO $$ BEGIN
  -- Rename notes to description if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'budget_lines' AND column_name = 'notes'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'budget_lines' AND column_name = 'description'
  ) THEN
    ALTER TABLE budget_lines RENAME COLUMN notes TO description;
    -- Make it NOT NULL with a default for existing rows
    UPDATE budget_lines SET description = '' WHERE description IS NULL;
    ALTER TABLE budget_lines ALTER COLUMN description SET NOT NULL;
  END IF;

  -- Rename period to period_month if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'budget_lines' AND column_name = 'period'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'budget_lines' AND column_name = 'period_month'
  ) THEN
    ALTER TABLE budget_lines RENAME COLUMN period TO period_month;
  END IF;

  -- Replace account_subject_id with account_code if needed
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'budget_lines' AND column_name = 'account_code'
  ) THEN
    ALTER TABLE budget_lines ADD COLUMN account_code TEXT;
  END IF;

  -- Add cost_center_id if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'budget_lines' AND column_name = 'cost_center_id'
  ) THEN
    ALTER TABLE budget_lines ADD COLUMN cost_center_id UUID REFERENCES cost_centers(id);
  END IF;

  -- Add variance_amount if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'budget_lines' AND column_name = 'variance_amount'
  ) THEN
    ALTER TABLE budget_lines ADD COLUMN variance_amount NUMERIC(18,4)
      GENERATED ALWAYS AS (planned_amount - actual_amount) STORED;
  END IF;
END $$;

-- purchase_order_items: ensure column names match production (014 schema)
DO $$ BEGIN
  -- Rename line_number to line_no if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'purchase_order_items' AND column_name = 'line_number'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'purchase_order_items' AND column_name = 'line_no'
  ) THEN
    ALTER TABLE purchase_order_items RENAME COLUMN line_number TO line_no;
  END IF;

  -- Rename qty to quantity if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'purchase_order_items' AND column_name = 'qty'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'purchase_order_items' AND column_name = 'quantity'
  ) THEN
    ALTER TABLE purchase_order_items RENAME COLUMN qty TO quantity;
  END IF;

  -- Rename received_qty to received_quantity if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'purchase_order_items' AND column_name = 'received_qty'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'purchase_order_items' AND column_name = 'received_quantity'
  ) THEN
    ALTER TABLE purchase_order_items RENAME COLUMN received_qty TO received_quantity;
  END IF;

  -- Rename invoiced_qty to invoiced_quantity if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'purchase_order_items' AND column_name = 'invoiced_qty'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'purchase_order_items' AND column_name = 'invoiced_quantity'
  ) THEN
    ALTER TABLE purchase_order_items RENAME COLUMN invoiced_qty TO invoiced_quantity;
  END IF;
END $$;

-- purchase_requisition_lines: ensure column names match production
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'purchase_requisition_lines' AND column_name = 'line_number'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'purchase_requisition_lines' AND column_name = 'line_no'
  ) THEN
    ALTER TABLE purchase_requisition_lines RENAME COLUMN line_number TO line_no;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'purchase_requisition_lines' AND column_name = 'estimated_unit_price'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'purchase_requisition_lines' AND column_name = 'unit_price'
  ) THEN
    ALTER TABLE purchase_requisition_lines RENAME COLUMN estimated_unit_price TO unit_price;
  END IF;
END $$;

-- sales_order_items: ensure column names match production (014 schema)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales_order_items' AND column_name = 'line_number'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales_order_items' AND column_name = 'line_no'
  ) THEN
    ALTER TABLE sales_order_items RENAME COLUMN line_number TO line_no;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales_order_items' AND column_name = 'qty'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales_order_items' AND column_name = 'quantity'
  ) THEN
    ALTER TABLE sales_order_items RENAME COLUMN qty TO quantity;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales_order_items' AND column_name = 'shipped_qty'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales_order_items' AND column_name = 'shipped_quantity'
  ) THEN
    ALTER TABLE sales_order_items RENAME COLUMN shipped_qty TO shipped_quantity;
  END IF;
END $$;

-- storage_locations: ensure column names match production (014 schema)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'storage_locations' AND column_name = 'location_code'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'storage_locations' AND column_name = 'code'
  ) THEN
    ALTER TABLE storage_locations RENAME COLUMN location_code TO code;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'storage_locations' AND column_name = 'name'
  ) THEN
    ALTER TABLE storage_locations ADD COLUMN name TEXT;
  END IF;
END $$;

-- inventory_reservations: ensure column names match production
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'inventory_reservations' AND column_name = 'reserved_qty'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'inventory_reservations' AND column_name = 'reserved_quantity'
  ) THEN
    ALTER TABLE inventory_reservations RENAME COLUMN reserved_qty TO reserved_quantity;
  END IF;
END $$;

-- voucher_entries: ensure column names match production
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'voucher_entries' AND column_name = 'description'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'voucher_entries' AND column_name = 'summary'
  ) THEN
    ALTER TABLE voucher_entries RENAME COLUMN description TO summary;
  END IF;
END $$;

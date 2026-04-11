-- 004_inventory.sql
-- Stock records, transactions, lots, serial numbers, reservations, counting

-- Stock records (current balance per org+warehouse+product)
CREATE TABLE public.stock_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  product_id UUID NOT NULL REFERENCES products(id),
  qty_on_hand NUMERIC(18,4) NOT NULL DEFAULT 0,
  qty_reserved NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK (qty_reserved >= 0),
  qty_available NUMERIC(18,4) GENERATED ALWAYS AS (qty_on_hand - qty_reserved) STORED,
  last_movement_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, warehouse_id, product_id)
);

CREATE INDEX idx_stock_records_org ON stock_records(organization_id);
CREATE INDEX idx_stock_records_warehouse ON stock_records(warehouse_id);
CREATE INDEX idx_stock_records_product ON stock_records(product_id);

-- Stock transactions (immutable audit trail)
CREATE TABLE public.stock_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  product_id UUID NOT NULL REFERENCES products(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('in', 'out', 'transfer', 'adjust', 'scrap')),
  qty NUMERIC(18,4) NOT NULL,
  reference_type TEXT,  -- 'purchase_receipt', 'sales_shipment', 'work_order', etc.
  reference_id UUID,
  lot_number TEXT,
  serial_number TEXT,
  storage_location_id UUID REFERENCES storage_locations(id),
  cost_price NUMERIC(18,4),
  notes TEXT,
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stock_transactions_org ON stock_transactions(organization_id);
CREATE INDEX idx_stock_transactions_warehouse_product ON stock_transactions(warehouse_id, product_id);
CREATE INDEX idx_stock_transactions_reference ON stock_transactions(reference_type, reference_id);
CREATE INDEX idx_stock_transactions_created ON stock_transactions(created_at);

-- Inventory lots (batch tracking)
CREATE TABLE public.inventory_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  product_id UUID NOT NULL REFERENCES products(id),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  lot_number TEXT NOT NULL,
  supplier_lot_number TEXT,
  manufacture_date DATE,
  expiry_date DATE,
  qty NUMERIC(18,4) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'quarantine', 'expired', 'consumed', 'rejected')),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, product_id, warehouse_id, lot_number),
  CHECK (expiry_date IS NULL OR manufacture_date IS NULL OR expiry_date >= manufacture_date)
);

CREATE INDEX idx_inventory_lots_product ON inventory_lots(product_id);
CREATE INDEX idx_inventory_lots_warehouse ON inventory_lots(warehouse_id);
CREATE INDEX idx_inventory_lots_status ON inventory_lots(status);
CREATE INDEX idx_inventory_lots_expiry ON inventory_lots(expiry_date);

-- Serial numbers (individual unit tracking)
CREATE TABLE public.serial_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  product_id UUID NOT NULL REFERENCES products(id),
  serial_number TEXT NOT NULL,
  lot_id UUID REFERENCES inventory_lots(id),
  warehouse_id UUID REFERENCES warehouses(id),
  status TEXT NOT NULL DEFAULT 'in_stock'
    CHECK (status IN ('in_stock', 'sold', 'in_transit', 'returned', 'scrapped', 'quarantine')),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, product_id, serial_number)
);

CREATE INDEX idx_serial_numbers_product ON serial_numbers(product_id);
CREATE INDEX idx_serial_numbers_status ON serial_numbers(status);

-- Inventory reservations
CREATE TABLE public.inventory_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  product_id UUID NOT NULL REFERENCES products(id),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  reserved_qty NUMERIC(18,4) NOT NULL CHECK (reserved_qty > 0),
  reference_type TEXT NOT NULL,  -- 'sales_order', 'work_order'
  reference_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'released', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inventory_reservations_product ON inventory_reservations(product_id);
CREATE INDEX idx_inventory_reservations_reference ON inventory_reservations(reference_type, reference_id);

-- Inventory counts (cycle counting)
CREATE TABLE public.inventory_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  count_number TEXT NOT NULL,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  count_date DATE NOT NULL DEFAULT CURRENT_DATE,
  count_type TEXT NOT NULL DEFAULT 'full' CHECK (count_type IN ('full', 'cycle', 'spot')),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'in_progress', 'completed', 'cancelled')),
  initiated_by UUID REFERENCES employees(id),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, count_number)
);

CREATE INDEX idx_inventory_counts_date ON inventory_counts(count_date);

-- Inventory count lines
CREATE TABLE public.inventory_count_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_count_id UUID NOT NULL REFERENCES inventory_counts(id),
  product_id UUID NOT NULL REFERENCES products(id),
  storage_location_id UUID REFERENCES storage_locations(id),
  lot_number TEXT,
  system_qty NUMERIC(18,4) NOT NULL DEFAULT 0,
  counted_qty NUMERIC(18,4),
  variance_qty NUMERIC(18,4) GENERATED ALWAYS AS (counted_qty - system_qty) STORED,
  counted_by UUID REFERENCES employees(id),
  counted_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inventory_count_lines_count ON inventory_count_lines(inventory_count_id);

-- Triggers
CREATE TRIGGER trg_stock_records_updated BEFORE UPDATE ON stock_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_inventory_lots_updated BEFORE UPDATE ON inventory_lots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_serial_numbers_updated BEFORE UPDATE ON serial_numbers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_inventory_reservations_updated BEFORE UPDATE ON inventory_reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_inventory_counts_updated BEFORE UPDATE ON inventory_counts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

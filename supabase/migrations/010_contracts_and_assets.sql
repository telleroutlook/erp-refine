-- 010_contracts_and_assets.sql
-- Contracts, fixed assets, depreciation, maintenance

-- Contracts
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  contract_number TEXT NOT NULL,
  title TEXT NOT NULL,
  party_type TEXT NOT NULL CHECK (party_type IN ('customer', 'supplier')),
  party_id UUID NOT NULL,
  contract_type TEXT DEFAULT 'standard'
    CHECK (contract_type IN ('standard', 'framework', 'blanket', 'service')),
  start_date DATE NOT NULL,
  end_date DATE,
  total_amount NUMERIC(18,2) CHECK (total_amount >= 0),
  currency TEXT DEFAULT 'CNY' REFERENCES currencies(currency_code),
  payment_terms TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'expired', 'terminated', 'cancelled')),
  signed_by UUID REFERENCES employees(id),
  signed_at TIMESTAMPTZ,
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, contract_number),
  CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX idx_contracts_org ON contracts(organization_id);
CREATE INDEX idx_contracts_party ON contracts(party_type, party_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_dates ON contracts(start_date, end_date);

-- Contract items
CREATE TABLE public.contract_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  description TEXT,
  qty NUMERIC(18,4) CHECK (qty > 0),
  unit_price NUMERIC(18,4) CHECK (unit_price >= 0),
  amount NUMERIC(18,2),
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contract_items_contract ON contract_items(contract_id);

-- Add contract FK to sales_orders
ALTER TABLE sales_orders
  ADD CONSTRAINT fk_sales_orders_contract
  FOREIGN KEY (contract_id) REFERENCES contracts(id);

-- Fixed assets
CREATE TABLE public.fixed_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  asset_number TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'equipment'
    CHECK (category IN ('land', 'building', 'equipment', 'vehicle', 'furniture', 'it_equipment', 'other')),
  acquisition_date DATE NOT NULL,
  acquisition_cost NUMERIC(18,2) NOT NULL CHECK (acquisition_cost > 0),
  residual_value NUMERIC(18,2) DEFAULT 0 CHECK (residual_value >= 0),
  useful_life_months INTEGER NOT NULL CHECK (useful_life_months > 0),
  depreciation_method TEXT NOT NULL DEFAULT 'straight_line'
    CHECK (depreciation_method IN ('straight_line', 'declining_balance', 'units_of_production')),
  accumulated_depreciation NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (accumulated_depreciation >= 0),
  net_book_value NUMERIC(18,2) GENERATED ALWAYS AS (acquisition_cost - accumulated_depreciation) STORED,
  department_id UUID REFERENCES departments(id),
  cost_center_id UUID REFERENCES cost_centers(id),
  warehouse_id UUID REFERENCES warehouses(id),
  responsible_person_id UUID REFERENCES employees(id),
  serial_number TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'idle', 'under_maintenance', 'disposed', 'scrapped')),
  disposed_date DATE,
  disposed_amount NUMERIC(18,2),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, asset_number)
);

CREATE INDEX idx_fixed_assets_org ON fixed_assets(organization_id);
CREATE INDEX idx_fixed_assets_status ON fixed_assets(status);
CREATE INDEX idx_fixed_assets_category ON fixed_assets(category);
CREATE INDEX idx_fixed_assets_department ON fixed_assets(department_id);

-- Asset depreciation records
CREATE TABLE public.asset_depreciations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixed_asset_id UUID NOT NULL REFERENCES fixed_assets(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL CHECK (period_month >= 1 AND period_month <= 12),
  depreciation_amount NUMERIC(18,2) NOT NULL CHECK (depreciation_amount >= 0),
  accumulated_amount NUMERIC(18,2) NOT NULL CHECK (accumulated_amount >= 0),
  net_book_value NUMERIC(18,2) NOT NULL,
  voucher_id UUID REFERENCES vouchers(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (fixed_asset_id, period_year, period_month)
);

CREATE INDEX idx_asset_depreciations_asset ON asset_depreciations(fixed_asset_id);
CREATE INDEX idx_asset_depreciations_period ON asset_depreciations(period_year, period_month);

-- Asset maintenance records
CREATE TABLE public.asset_maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixed_asset_id UUID NOT NULL REFERENCES fixed_assets(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  maintenance_type TEXT NOT NULL DEFAULT 'preventive'
    CHECK (maintenance_type IN ('preventive', 'corrective', 'predictive', 'emergency')),
  maintenance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  cost NUMERIC(18,2) DEFAULT 0 CHECK (cost >= 0),
  performed_by TEXT,
  next_maintenance_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_asset_maintenance_asset ON asset_maintenance_records(fixed_asset_id);
CREATE INDEX idx_asset_maintenance_date ON asset_maintenance_records(maintenance_date);

-- Triggers
CREATE TRIGGER trg_contracts_updated BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_contract_items_updated BEFORE UPDATE ON contract_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_fixed_assets_updated BEFORE UPDATE ON fixed_assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_asset_maintenance_updated BEFORE UPDATE ON asset_maintenance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

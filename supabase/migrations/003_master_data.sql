-- 003_master_data.sql
-- Products, customers, suppliers, warehouses, pricing, tax codes, carriers

-- Tax codes
CREATE TABLE public.tax_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  rate NUMERIC(5,2) NOT NULL CHECK (rate >= 0 AND rate <= 100),
  tax_type TEXT NOT NULL DEFAULT 'vat' CHECK (tax_type IN ('vat', 'gst', 'sales_tax', 'exempt', 'zero_rated')),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, code)
);

CREATE INDEX idx_tax_codes_org ON tax_codes(organization_id);

-- Product categories (tree)
CREATE TABLE public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES product_categories(id),
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 5),
  description TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, code)
);

CREATE INDEX idx_product_categories_org ON product_categories(organization_id);
CREATE INDEX idx_product_categories_parent ON product_categories(parent_id);

-- Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  category_id UUID REFERENCES product_categories(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL DEFAULT 'EA',
  type TEXT NOT NULL DEFAULT 'material'
    CHECK (type IN ('material', 'finished_good', 'semi_finished', 'service', 'asset', 'consumable')),
  cost_price NUMERIC(18,4) DEFAULT 0 CHECK (cost_price >= 0),
  list_price NUMERIC(18,4) DEFAULT 0 CHECK (list_price >= 0),
  default_tax_code_id UUID REFERENCES tax_codes(id),
  is_lot_controlled BOOLEAN NOT NULL DEFAULT FALSE,
  is_serial_controlled BOOLEAN NOT NULL DEFAULT FALSE,
  safety_stock_days INTEGER DEFAULT 0 CHECK (safety_stock_days >= 0),
  average_daily_consumption NUMERIC(18,4) DEFAULT 0 CHECK (average_daily_consumption >= 0),
  min_stock NUMERIC(18,4) DEFAULT 0 CHECK (min_stock >= 0),
  max_stock NUMERIC(18,4) DEFAULT 0 CHECK (max_stock >= 0),
  lead_time_days INTEGER DEFAULT 0 CHECK (lead_time_days >= 0),
  weight NUMERIC(12,4),
  volume NUMERIC(12,4),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, code)
);

CREATE INDEX idx_products_org ON products(organization_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_type ON products(type);
CREATE INDEX idx_products_name_trgm ON products USING gin (name gin_trgm_ops);

-- Customers
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  customer_type TEXT NOT NULL DEFAULT 'enterprise'
    CHECK (customer_type IN ('enterprise', 'individual', 'government', 'distributor')),
  classification TEXT DEFAULT 'standard'
    CHECK (classification IN ('vip', 'key', 'standard', 'occasional')),
  tax_number TEXT,
  credit_limit NUMERIC(18,2) DEFAULT 0 CHECK (credit_limit >= 0),
  payment_terms INTEGER DEFAULT 30 CHECK (payment_terms >= 0),
  default_currency TEXT DEFAULT 'CNY' REFERENCES currencies(currency_code),
  contact TEXT,
  phone TEXT,
  email TEXT,
  street TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'CN',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, code)
);

CREATE INDEX idx_customers_org ON customers(organization_id);
CREATE INDEX idx_customers_type ON customers(customer_type);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_name_trgm ON customers USING gin (name gin_trgm_ops);

-- Customer addresses (multiple per customer)
CREATE TABLE public.customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  address_type TEXT NOT NULL DEFAULT 'billing' CHECK (address_type IN ('billing', 'shipping', 'both')),
  contact_name TEXT,
  phone TEXT,
  street TEXT NOT NULL,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'CN',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customer_addresses_customer ON customer_addresses(customer_id);

-- Customer bank accounts
CREATE TABLE public.customer_bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT,
  swift_code TEXT,
  currency TEXT DEFAULT 'CNY' REFERENCES currencies(currency_code),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customer_bank_accounts_customer ON customer_bank_accounts(customer_id);

-- Suppliers
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  supplier_type TEXT NOT NULL DEFAULT 'material'
    CHECK (supplier_type IN ('material', 'service', 'subcontractor', 'logistics')),
  tax_number TEXT,
  currency TEXT DEFAULT 'CNY' REFERENCES currencies(currency_code),
  payment_terms INTEGER DEFAULT 30 CHECK (payment_terms >= 0),
  lead_time_days INTEGER DEFAULT 7 CHECK (lead_time_days >= 0),
  reliability_score NUMERIC(3,2) DEFAULT 1.00 CHECK (reliability_score >= 0 AND reliability_score <= 1),
  contact TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  street TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'CN',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked', 'pending_approval')),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, code)
);

CREATE INDEX idx_suppliers_org ON suppliers(organization_id);
CREATE INDEX idx_suppliers_type ON suppliers(supplier_type);
CREATE INDEX idx_suppliers_status ON suppliers(status);
CREATE INDEX idx_suppliers_name_trgm ON suppliers USING gin (name gin_trgm_ops);

-- Supplier sites
CREATE TABLE public.supplier_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  site_code TEXT NOT NULL,
  site_name TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'CN',
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (supplier_id, site_code)
);

CREATE INDEX idx_supplier_sites_supplier ON supplier_sites(supplier_id);

-- Supplier bank accounts
CREATE TABLE public.supplier_bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT,
  swift_code TEXT,
  currency TEXT DEFAULT 'CNY' REFERENCES currencies(currency_code),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_supplier_bank_accounts_supplier ON supplier_bank_accounts(supplier_id);

-- Warehouses
CREATE TABLE public.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  warehouse_type TEXT NOT NULL DEFAULT 'standard'
    CHECK (warehouse_type IN ('standard', 'cold_storage', 'hazardous', 'bonded', 'virtual')),
  capacity_volume NUMERIC(12,2),
  capacity_weight NUMERIC(12,2),
  manager_id UUID REFERENCES employees(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, code)
);

CREATE INDEX idx_warehouses_org ON warehouses(organization_id);

-- Storage locations (bins within warehouse)
CREATE TABLE public.storage_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  location_code TEXT NOT NULL,
  zone TEXT DEFAULT 'default',
  bin_type TEXT DEFAULT 'rack' CHECK (bin_type IN ('rack', 'bulk', 'floor', 'cold', 'quarantine')),
  capacity NUMERIC(12,2),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (warehouse_id, location_code)
);

CREATE INDEX idx_storage_locations_warehouse ON storage_locations(warehouse_id);

-- Carriers (shipping companies)
CREATE TABLE public.carriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  carrier_type TEXT DEFAULT 'express' CHECK (carrier_type IN ('express', 'freight', 'ltl', 'ftl', 'ocean', 'air')),
  contact TEXT,
  phone TEXT,
  tracking_url_template TEXT,  -- e.g., 'https://tracking.example.com/{tracking_number}'
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, code)
);

CREATE INDEX idx_carriers_org ON carriers(organization_id);

-- Price lists
CREATE TABLE public.price_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  price_type TEXT NOT NULL DEFAULT 'sales' CHECK (price_type IN ('sales', 'purchase')),
  currency TEXT NOT NULL DEFAULT 'CNY' REFERENCES currencies(currency_code),
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, code),
  CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

CREATE INDEX idx_price_lists_org ON price_lists(organization_id);
CREATE INDEX idx_price_lists_effective ON price_lists(effective_from, effective_to);

-- Price list lines
CREATE TABLE public.price_list_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_list_id UUID NOT NULL REFERENCES price_lists(id),
  product_id UUID NOT NULL REFERENCES products(id),
  unit_price NUMERIC(18,4) NOT NULL CHECK (unit_price >= 0),
  min_quantity NUMERIC(18,4) DEFAULT 1 CHECK (min_quantity > 0),
  discount_rate NUMERIC(5,2) DEFAULT 0 CHECK (discount_rate >= 0 AND discount_rate <= 100),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (price_list_id, product_id, min_quantity)
);

CREATE INDEX idx_price_list_lines_product ON price_list_lines(product_id);

-- Triggers
CREATE TRIGGER trg_tax_codes_updated BEFORE UPDATE ON tax_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_product_categories_updated BEFORE UPDATE ON product_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_customer_addresses_updated BEFORE UPDATE ON customer_addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_suppliers_updated BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_supplier_sites_updated BEFORE UPDATE ON supplier_sites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_warehouses_updated BEFORE UPDATE ON warehouses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_storage_locations_updated BEFORE UPDATE ON storage_locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_carriers_updated BEFORE UPDATE ON carriers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_price_lists_updated BEFORE UPDATE ON price_lists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_price_list_lines_updated BEFORE UPDATE ON price_list_lines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

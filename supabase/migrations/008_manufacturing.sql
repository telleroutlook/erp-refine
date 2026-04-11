-- 008_manufacturing.sql
-- BOM, work orders, materials, production reporting

-- BOM headers
CREATE TABLE public.bom_headers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  bom_number TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id),
  version INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  qty NUMERIC(18,4) NOT NULL DEFAULT 1 CHECK (qty > 0),
  effective_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'obsolete')),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, bom_number, version),
  CHECK (expiry_date IS NULL OR expiry_date >= effective_date)
);

CREATE INDEX idx_bom_headers_org ON bom_headers(organization_id);
CREATE INDEX idx_bom_headers_product ON bom_headers(product_id);

-- BOM items (components)
CREATE TABLE public.bom_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_header_id UUID NOT NULL REFERENCES bom_headers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  qty NUMERIC(18,4) NOT NULL CHECK (qty > 0),
  unit TEXT NOT NULL DEFAULT 'EA',
  scrap_rate NUMERIC(5,2) DEFAULT 0 CHECK (scrap_rate >= 0 AND scrap_rate <= 100),
  sequence INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bom_items_header ON bom_items(bom_header_id);
CREATE INDEX idx_bom_items_product ON bom_items(product_id);

-- Work orders
CREATE TABLE public.work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  work_order_number TEXT NOT NULL,
  bom_header_id UUID NOT NULL REFERENCES bom_headers(id),
  product_id UUID NOT NULL REFERENCES products(id),
  planned_qty NUMERIC(18,4) NOT NULL CHECK (planned_qty > 0),
  completed_qty NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK (completed_qty >= 0),
  warehouse_id UUID REFERENCES warehouses(id),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  planned_completion_date DATE,
  actual_completion_date DATE,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'released', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_by UUID REFERENCES employees(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, work_order_number),
  CHECK (planned_completion_date IS NULL OR planned_completion_date >= start_date)
);

CREATE INDEX idx_work_orders_org ON work_orders(organization_id);
CREATE INDEX idx_work_orders_product ON work_orders(product_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_start ON work_orders(start_date);

-- Work order materials (issued materials)
CREATE TABLE public.work_order_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  required_qty NUMERIC(18,4) NOT NULL CHECK (required_qty > 0),
  issued_qty NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK (issued_qty >= 0),
  returned_qty NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK (returned_qty >= 0),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'partially_issued', 'fully_issued', 'returned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wo_materials_wo ON work_order_materials(work_order_id);

-- Work order productions (output reporting)
CREATE TABLE public.work_order_productions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  production_date DATE NOT NULL DEFAULT CURRENT_DATE,
  quantity NUMERIC(18,4) NOT NULL CHECK (quantity > 0),
  qualified_qty NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK (qualified_qty >= 0),
  defective_qty NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK (defective_qty >= 0),
  operator_id UUID REFERENCES employees(id),
  shift TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (qualified_qty + defective_qty = quantity)
);

CREATE INDEX idx_wo_productions_wo ON work_order_productions(work_order_id);
CREATE INDEX idx_wo_productions_date ON work_order_productions(production_date);

-- Triggers
CREATE TRIGGER trg_bom_headers_updated BEFORE UPDATE ON bom_headers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_bom_items_updated BEFORE UPDATE ON bom_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_work_orders_updated BEFORE UPDATE ON work_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_wo_materials_updated BEFORE UPDATE ON work_order_materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

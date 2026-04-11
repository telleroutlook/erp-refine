-- 009_quality.sql
-- Quality standards, inspections, defect codes

-- Defect codes (root cause classification)
CREATE TABLE public.defect_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'general'
    CHECK (category IN ('general', 'material', 'process', 'design', 'environmental', 'human')),
  severity TEXT DEFAULT 'minor' CHECK (severity IN ('minor', 'major', 'critical')),
  description TEXT,
  corrective_action TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, code)
);

CREATE INDEX idx_defect_codes_org ON defect_codes(organization_id);

-- Quality standards (templates)
CREATE TABLE public.quality_standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  product_id UUID REFERENCES products(id),
  product_category_id UUID REFERENCES product_categories(id),
  applicable_to TEXT NOT NULL DEFAULT 'all'
    CHECK (applicable_to IN ('all', 'incoming', 'in_process', 'final', 'return')),
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, code, version)
);

CREATE INDEX idx_quality_standards_org ON quality_standards(organization_id);

-- Quality standard items (check items in template)
CREATE TABLE public.quality_standard_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quality_standard_id UUID NOT NULL REFERENCES quality_standards(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL DEFAULT 1,
  check_item TEXT NOT NULL,
  check_method TEXT,
  check_standard TEXT NOT NULL,
  lower_limit NUMERIC(18,4),
  upper_limit NUMERIC(18,4),
  unit TEXT,
  is_critical BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (lower_limit IS NULL OR upper_limit IS NULL OR upper_limit >= lower_limit)
);

CREATE INDEX idx_qsi_standard ON quality_standard_items(quality_standard_id);

-- Quality inspections
CREATE TABLE public.quality_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  inspection_number TEXT NOT NULL,
  quality_standard_id UUID REFERENCES quality_standards(id),
  reference_type TEXT NOT NULL
    CHECK (reference_type IN ('purchase_receipt', 'work_order', 'sales_return', 'in_process', 'final')),
  reference_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id),
  inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  inspector_id UUID REFERENCES employees(id),
  total_qty NUMERIC(18,4) NOT NULL CHECK (total_qty > 0),
  sample_qty NUMERIC(18,4),
  qualified_qty NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK (qualified_qty >= 0),
  defective_qty NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK (defective_qty >= 0),
  result TEXT NOT NULL DEFAULT 'pending'
    CHECK (result IN ('pending', 'pass', 'fail', 'conditional')),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'in_progress', 'completed', 'cancelled')),
  defect_code_id UUID REFERENCES defect_codes(id),
  notes TEXT,
  completed_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, inspection_number)
);

CREATE INDEX idx_quality_inspections_org ON quality_inspections(organization_id);
CREATE INDEX idx_quality_inspections_reference ON quality_inspections(reference_type, reference_id);
CREATE INDEX idx_quality_inspections_product ON quality_inspections(product_id);
CREATE INDEX idx_quality_inspections_result ON quality_inspections(result);
CREATE INDEX idx_quality_inspections_date ON quality_inspections(inspection_date);

-- Quality inspection items (results)
CREATE TABLE public.quality_inspection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quality_inspection_id UUID NOT NULL REFERENCES quality_inspections(id) ON DELETE CASCADE,
  quality_standard_item_id UUID REFERENCES quality_standard_items(id),
  check_item TEXT NOT NULL,
  check_standard TEXT,
  measured_value TEXT,
  numeric_value NUMERIC(18,4),
  check_result TEXT NOT NULL DEFAULT 'pending'
    CHECK (check_result IN ('pending', 'pass', 'fail', 'na')),
  defect_code_id UUID REFERENCES defect_codes(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_qi_items_inspection ON quality_inspection_items(quality_inspection_id);

-- Triggers
CREATE TRIGGER trg_defect_codes_updated BEFORE UPDATE ON defect_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_quality_standards_updated BEFORE UPDATE ON quality_standards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_quality_inspections_updated BEFORE UPDATE ON quality_inspections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

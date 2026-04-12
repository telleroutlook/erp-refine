-- 014_erp_refine_additions.sql
-- Additive migration: tables required by erp-refine but not in ai-native-erp baseline
-- Only creates tables that don't already exist

-- ============================================================
-- 1. Number Sequences (for order numbering)
-- ============================================================
CREATE TABLE IF NOT EXISTS number_sequences (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sequence_name   TEXT NOT NULL,
  prefix          TEXT NOT NULL DEFAULT '',
  current_value   INTEGER NOT NULL DEFAULT 0,
  increment_by    INTEGER NOT NULL DEFAULT 1,
  padding         INTEGER NOT NULL DEFAULT 6,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, sequence_name)
);

-- ============================================================
-- 2. Schema Registry (AI-generated UI schemas)
-- ============================================================
CREATE TABLE IF NOT EXISTS schema_registry (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  slug            TEXT NOT NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  risk_level      TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  created_by      UUID REFERENCES users(id),
  activated_at    TIMESTAMPTZ,
  archived_at     TIMESTAMPTZ,
  deleted_at      TIMESTAMPTZ DEFAULT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, slug)
);

CREATE TABLE IF NOT EXISTS schema_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_id       UUID NOT NULL REFERENCES schema_registry(id) ON DELETE CASCADE,
  version         INTEGER NOT NULL DEFAULT 1,
  json_schema     JSONB NOT NULL,
  ui_schema       JSONB,
  schema_diff     JSONB,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (schema_id, version)
);

CREATE TABLE IF NOT EXISTS component_whitelist (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_name  TEXT NOT NULL UNIQUE,
  component_type  TEXT NOT NULL,
  description     TEXT,
  allowed_roles   TEXT[] DEFAULT ARRAY['admin', 'developer'],
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed whitelist
INSERT INTO component_whitelist (component_name, component_type, description) VALUES
  ('text',         'input',    'Single-line text input'),
  ('number',       'input',    'Numeric input'),
  ('date',         'picker',   'Date picker'),
  ('select',       'select',   'Single-value dropdown'),
  ('multiselect',  'select',   'Multi-value dropdown'),
  ('textarea',     'input',    'Multi-line text area'),
  ('rate',         'input',    'Star rating'),
  ('checkbox',     'input',    'Boolean checkbox'),
  ('radio',        'input',    'Radio button group'),
  ('file-upload',  'upload',   'File/attachment upload'),
  ('currency',     'input',    'Currency amount with symbol'),
  ('percentage',   'input',    'Percentage value 0-100')
ON CONFLICT (component_name) DO NOTHING;

-- ============================================================
-- 3. Approval Rules & Records
-- ============================================================
CREATE TABLE IF NOT EXISTS approval_rules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  rule_name       TEXT NOT NULL,
  document_type   TEXT NOT NULL,
  min_amount      NUMERIC(18,4) DEFAULT 0,
  max_amount      NUMERIC(18,4),
  required_roles  TEXT[] NOT NULL DEFAULT ARRAY['manager'],
  sequence_order  INTEGER NOT NULL DEFAULT 1,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at      TIMESTAMPTZ DEFAULT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS approval_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  rule_id         UUID REFERENCES approval_rules(id),
  document_type   TEXT NOT NULL,
  document_id     UUID NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'recalled')),
  decision_by     UUID REFERENCES users(id),
  decision_at     TIMESTAMPTZ,
  comments        TEXT,
  decision_level  INTEGER DEFAULT 1,
  deleted_at      TIMESTAMPTZ DEFAULT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. RFQ (Request for Quotation)
-- ============================================================
CREATE TABLE IF NOT EXISTS rfq_headers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  rfq_number      TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'closed', 'cancelled')),
  purchase_request_id UUID,
  due_date        DATE,
  notes           TEXT,
  issued_by       UUID REFERENCES users(id),
  issued_at       TIMESTAMPTZ,
  deleted_at      TIMESTAMPTZ DEFAULT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, rfq_number)
);

CREATE TABLE IF NOT EXISTS rfq_lines (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id          UUID NOT NULL REFERENCES rfq_headers(id) ON DELETE CASCADE,
  line_number     INTEGER NOT NULL,
  product_id      UUID REFERENCES products(id),
  description     TEXT NOT NULL,
  qty_requested   NUMERIC(18,4) NOT NULL DEFAULT 1,
  unit_of_measure TEXT,
  deleted_at      TIMESTAMPTZ DEFAULT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supplier_quotations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id          UUID NOT NULL REFERENCES rfq_headers(id) ON DELETE CASCADE,
  supplier_id     UUID NOT NULL REFERENCES suppliers(id),
  quotation_number TEXT,
  status          TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'evaluated', 'selected', 'rejected')),
  validity_date   DATE,
  currency        TEXT NOT NULL DEFAULT 'CNY',
  notes           TEXT,
  deleted_at      TIMESTAMPTZ DEFAULT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supplier_quotation_lines (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id    UUID NOT NULL REFERENCES supplier_quotations(id) ON DELETE CASCADE,
  rfq_line_id     UUID REFERENCES rfq_lines(id),
  product_id      UUID REFERENCES products(id),
  description     TEXT,
  qty_offered     NUMERIC(18,4) NOT NULL DEFAULT 1,
  unit_price      NUMERIC(18,4) NOT NULL DEFAULT 0,
  total_price     NUMERIC(18,4) GENERATED ALWAYS AS (qty_offered * unit_price) STORED,
  lead_time_days  INTEGER,
  deleted_at      TIMESTAMPTZ DEFAULT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. Serial Numbers
-- ============================================================
CREATE TABLE IF NOT EXISTS serial_numbers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES products(id),
  serial_number   TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'in_stock' CHECK (status IN ('in_stock', 'sold', 'scrapped', 'returned')),
  warehouse_id    UUID REFERENCES warehouses(id),
  sales_order_id  UUID,
  purchase_order_id UUID,
  received_at     TIMESTAMPTZ,
  shipped_at      TIMESTAMPTZ,
  deleted_at      TIMESTAMPTZ DEFAULT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, serial_number)
);

-- ============================================================
-- 6. Quality
-- ============================================================
CREATE TABLE IF NOT EXISTS quality_standards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  standard_name   TEXT NOT NULL,
  standard_code   TEXT NOT NULL,
  description     TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at      TIMESTAMPTZ DEFAULT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, standard_code)
);

CREATE TABLE IF NOT EXISTS quality_standard_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  standard_id     UUID NOT NULL REFERENCES quality_standards(id) ON DELETE CASCADE,
  item_name       TEXT NOT NULL,
  check_method    TEXT,
  acceptance_criteria TEXT,
  is_mandatory    BOOLEAN NOT NULL DEFAULT TRUE,
  sequence_order  INTEGER DEFAULT 1,
  deleted_at      TIMESTAMPTZ DEFAULT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS defect_codes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code            TEXT NOT NULL,
  name            TEXT NOT NULL,
  category        TEXT,
  severity        TEXT NOT NULL DEFAULT 'minor' CHECK (severity IN ('minor', 'major', 'critical')),
  description     TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at      TIMESTAMPTZ DEFAULT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, code)
);

-- ============================================================
-- 7. Fixed Assets
-- ============================================================
CREATE TABLE IF NOT EXISTS fixed_assets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_number    TEXT NOT NULL,
  asset_name      TEXT NOT NULL,
  category        TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disposed', 'under_maintenance')),
  acquisition_date DATE NOT NULL,
  acquisition_cost NUMERIC(18,4) NOT NULL DEFAULT 0,
  salvage_value   NUMERIC(18,4) NOT NULL DEFAULT 0,
  useful_life_months INTEGER NOT NULL DEFAULT 60,
  depreciation_method TEXT NOT NULL DEFAULT 'straight_line' CHECK (depreciation_method IN ('straight_line', 'declining_balance')),
  current_book_value NUMERIC(18,4),
  location        TEXT,
  department      TEXT,
  custodian_id    UUID REFERENCES users(id),
  cost_center_id  UUID,
  notes           TEXT,
  deleted_at      TIMESTAMPTZ DEFAULT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, asset_number)
);

CREATE TABLE IF NOT EXISTS asset_depreciations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id        UUID NOT NULL REFERENCES fixed_assets(id) ON DELETE CASCADE,
  period_year     INTEGER NOT NULL,
  period_month    INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  depreciation_amount NUMERIC(18,4) NOT NULL DEFAULT 0,
  accumulated_depreciation NUMERIC(18,4) NOT NULL DEFAULT 0,
  book_value_after NUMERIC(18,4) NOT NULL DEFAULT 0,
  posted          BOOLEAN NOT NULL DEFAULT FALSE,
  posted_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (asset_id, period_year, period_month)
);

CREATE TABLE IF NOT EXISTS asset_maintenance_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id        UUID NOT NULL REFERENCES fixed_assets(id) ON DELETE CASCADE,
  maintenance_type TEXT NOT NULL DEFAULT 'routine' CHECK (maintenance_type IN ('routine', 'repair', 'overhaul')),
  description     TEXT NOT NULL,
  cost            NUMERIC(18,4) DEFAULT 0,
  performed_by    TEXT,
  performed_at    TIMESTAMPTZ NOT NULL,
  next_due_at     TIMESTAMPTZ,
  deleted_at      TIMESTAMPTZ DEFAULT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 8. Cost Centers & Budgets
-- ============================================================
CREATE TABLE IF NOT EXISTS cost_centers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code            TEXT NOT NULL,
  name            TEXT NOT NULL,
  parent_id       UUID REFERENCES cost_centers(id),
  manager_id      UUID REFERENCES users(id),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at      TIMESTAMPTZ DEFAULT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, code)
);

-- Add FK to fixed_assets now that cost_centers exists
ALTER TABLE fixed_assets
  ADD CONSTRAINT fk_asset_cost_center
  FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id)
  NOT VALID;

CREATE TABLE IF NOT EXISTS budgets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  budget_name     TEXT NOT NULL,
  budget_year     INTEGER NOT NULL,
  budget_type     TEXT NOT NULL DEFAULT 'annual' CHECK (budget_type IN ('annual', 'quarterly', 'monthly', 'project')),
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'active', 'closed')),
  total_amount    NUMERIC(18,4) NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'CNY',
  approved_by     UUID REFERENCES users(id),
  approved_at     TIMESTAMPTZ,
  notes           TEXT,
  deleted_at      TIMESTAMPTZ DEFAULT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS budget_lines (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id       UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  cost_center_id  UUID REFERENCES cost_centers(id),
  account_code    TEXT,
  description     TEXT NOT NULL,
  period_month    INTEGER CHECK (period_month BETWEEN 1 AND 12),
  planned_amount  NUMERIC(18,4) NOT NULL DEFAULT 0,
  actual_amount   NUMERIC(18,4) NOT NULL DEFAULT 0,
  variance_amount NUMERIC(18,4) GENERATED ALWAYS AS (planned_amount - actual_amount) STORED,
  deleted_at      TIMESTAMPTZ DEFAULT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 9. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_schema_registry_org ON schema_registry(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_schema_versions_schema ON schema_versions(schema_id);
CREATE INDEX IF NOT EXISTS idx_approval_records_doc ON approval_records(document_type, document_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_rfq_headers_org ON rfq_headers(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_serial_numbers_org ON serial_numbers(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_fixed_assets_org ON fixed_assets(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cost_centers_org ON cost_centers(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_budgets_org ON budgets(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_number_sequences_org ON number_sequences(organization_id);

-- ============================================================
-- 10. RLS Policies
-- ============================================================
ALTER TABLE number_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE schema_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE schema_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_headers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_quotation_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE serial_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_standard_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE defect_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_depreciations ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_lines ENABLE ROW LEVEL SECURITY;

-- Org-scoped tables: access if user belongs to same org
CREATE POLICY "org_access" ON number_sequences FOR ALL
  USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID);

CREATE POLICY "org_access" ON schema_registry FOR ALL
  USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID);

CREATE POLICY "org_access" ON approval_rules FOR ALL
  USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID);

CREATE POLICY "org_access" ON approval_records FOR ALL
  USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID);

CREATE POLICY "org_access" ON rfq_headers FOR ALL
  USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID);

CREATE POLICY "org_access" ON serial_numbers FOR ALL
  USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID);

CREATE POLICY "org_access" ON quality_standards FOR ALL
  USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID);

CREATE POLICY "org_access" ON defect_codes FOR ALL
  USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID);

CREATE POLICY "org_access" ON fixed_assets FOR ALL
  USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID);

CREATE POLICY "org_access" ON cost_centers FOR ALL
  USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID);

CREATE POLICY "org_access" ON budgets FOR ALL
  USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID);

-- Join-based policies for child tables
CREATE POLICY "org_access_via_schema" ON schema_versions FOR ALL
  USING (schema_id IN (
    SELECT id FROM schema_registry
    WHERE organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID
  ));

CREATE POLICY "org_access_via_rfq" ON rfq_lines FOR ALL
  USING (rfq_id IN (
    SELECT id FROM rfq_headers
    WHERE organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID
  ));

CREATE POLICY "org_access_via_rfq" ON supplier_quotations FOR ALL
  USING (rfq_id IN (
    SELECT id FROM rfq_headers
    WHERE organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID
  ));

CREATE POLICY "org_access_via_quotation" ON supplier_quotation_lines FOR ALL
  USING (quotation_id IN (
    SELECT sq.id FROM supplier_quotations sq
    JOIN rfq_headers rh ON rh.id = sq.rfq_id
    WHERE rh.organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID
  ));

CREATE POLICY "org_access_via_standard" ON quality_standard_items FOR ALL
  USING (standard_id IN (
    SELECT id FROM quality_standards
    WHERE organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID
  ));

CREATE POLICY "org_access_via_asset" ON asset_depreciations FOR ALL
  USING (asset_id IN (
    SELECT id FROM fixed_assets
    WHERE organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID
  ));

CREATE POLICY "org_access_via_asset" ON asset_maintenance_records FOR ALL
  USING (asset_id IN (
    SELECT id FROM fixed_assets
    WHERE organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID
  ));

CREATE POLICY "org_access_via_budget" ON budget_lines FOR ALL
  USING (budget_id IN (
    SELECT id FROM budgets
    WHERE organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID
  ));

-- Component whitelist: readable by all authenticated users
CREATE POLICY "read_all" ON component_whitelist FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admin_manage" ON component_whitelist FOR ALL USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'developer')
);

-- ============================================================
-- 11. get_next_sequence RPC (if not already exists from earlier migrations)
-- ============================================================
CREATE OR REPLACE FUNCTION get_next_sequence(
  p_organization_id UUID,
  p_sequence_name   TEXT
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_seq    number_sequences%ROWTYPE;
  v_next   INTEGER;
  v_padded TEXT;
BEGIN
  SELECT * INTO v_seq
  FROM number_sequences
  WHERE organization_id = p_organization_id
    AND sequence_name = p_sequence_name
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sequence not found: %', p_sequence_name;
  END IF;

  v_next := v_seq.current_value + v_seq.increment_by;

  UPDATE number_sequences
  SET current_value = v_next,
      updated_at    = NOW()
  WHERE id = v_seq.id;

  v_padded := lpad(v_next::TEXT, v_seq.padding, '0');
  RETURN v_seq.prefix || v_padded;
END;
$$;

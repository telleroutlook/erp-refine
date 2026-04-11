-- 002_infrastructure.sql
-- Organizations, departments, employees, currencies, UOMs, sequences

-- Organizations (multi-tenant root)
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  legal_name TEXT,
  tax_number TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  default_currency TEXT NOT NULL DEFAULT 'CNY',
  plan TEXT NOT NULL DEFAULT 'standard' CHECK (plan IN ('free', 'standard', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Departments (tree structure)
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES departments(id),
  manager_id UUID,  -- FK to employees added after employees table
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 10),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, code)
);

CREATE INDEX idx_departments_org ON departments(organization_id);
CREATE INDEX idx_departments_parent ON departments(parent_id);

-- Employees (linked to auth.users)
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  department_id UUID REFERENCES departments(id),
  employee_number TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  position TEXT,
  role TEXT NOT NULL DEFAULT 'viewer'
    CHECK (role IN ('admin', 'manager', 'procurement_manager', 'sales_manager',
                    'finance_manager', 'inventory_manager', 'quality_manager',
                    'production_manager', 'viewer')),
  hire_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, employee_number)
);

CREATE INDEX idx_employees_org ON employees(organization_id);
CREATE INDEX idx_employees_user ON employees(user_id);
CREATE INDEX idx_employees_dept ON employees(department_id);
CREATE INDEX idx_employees_status ON employees(status);

-- Add deferred FK for departments.manager_id
ALTER TABLE departments
  ADD CONSTRAINT fk_departments_manager
  FOREIGN KEY (manager_id) REFERENCES employees(id)
  DEFERRABLE INITIALLY DEFERRED;

-- Currencies (global, no org)
CREATE TABLE public.currencies (
  currency_code TEXT PRIMARY KEY,
  currency_name TEXT NOT NULL,
  symbol TEXT,
  decimal_places INTEGER NOT NULL DEFAULT 2 CHECK (decimal_places >= 0 AND decimal_places <= 4),
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- UOMs (global, hierarchical conversion)
CREATE TABLE public.uoms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uom_code TEXT NOT NULL UNIQUE,
  uom_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'unit' CHECK (category IN ('unit', 'weight', 'volume', 'length', 'area', 'time')),
  base_uom_id UUID REFERENCES uoms(id),
  conversion_factor NUMERIC(18,6) NOT NULL DEFAULT 1.0 CHECK (conversion_factor > 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Exchange rates (per org)
CREATE TABLE public.exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  from_currency TEXT NOT NULL REFERENCES currencies(currency_code),
  to_currency TEXT NOT NULL REFERENCES currencies(currency_code),
  rate NUMERIC(18,8) NOT NULL CHECK (rate > 0),
  effective_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, from_currency, to_currency, effective_date)
);

CREATE INDEX idx_exchange_rates_date ON exchange_rates(effective_date);

-- Number sequences (auto-increment document numbers)
CREATE TABLE public.number_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  entity_type TEXT NOT NULL,  -- 'purchase_order', 'sales_order', etc.
  prefix TEXT NOT NULL DEFAULT '',
  current_value BIGINT NOT NULL DEFAULT 0,
  step INTEGER NOT NULL DEFAULT 1,
  pad_length INTEGER NOT NULL DEFAULT 6,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, entity_type)
);

-- Function to generate next number
CREATE OR REPLACE FUNCTION public.next_number(p_org_id UUID, p_entity_type TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_prefix TEXT;
  v_value BIGINT;
  v_pad INTEGER;
BEGIN
  UPDATE number_sequences
  SET current_value = current_value + step,
      updated_at = NOW()
  WHERE organization_id = p_org_id AND entity_type = p_entity_type
  RETURNING prefix, current_value, pad_length INTO v_prefix, v_value, v_pad;

  IF NOT FOUND THEN
    INSERT INTO number_sequences (organization_id, entity_type, current_value)
    VALUES (p_org_id, p_entity_type, 1)
    RETURNING prefix, current_value, pad_length INTO v_prefix, v_value, v_pad;
  END IF;

  RETURN v_prefix || LPAD(v_value::TEXT, v_pad, '0');
END;
$$;

-- Approval rules (multi-level approval)
CREATE TABLE public.approval_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  entity_type TEXT NOT NULL,  -- 'purchase_order', 'payment_request', etc.
  rule_name TEXT NOT NULL,
  condition_field TEXT,        -- e.g., 'total_amount'
  condition_operator TEXT CHECK (condition_operator IN ('>=', '<=', '>', '<', '=', 'in')),
  condition_value TEXT,        -- e.g., '50000'
  approver_role TEXT NOT NULL,
  step_order INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_approval_rules_org ON approval_rules(organization_id);
CREATE INDEX idx_approval_rules_entity ON approval_rules(entity_type);

-- Approval records (immutable audit)
CREATE TABLE public.approval_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  rule_id UUID REFERENCES approval_rules(id),
  step_no INTEGER NOT NULL DEFAULT 1,
  approver_id UUID REFERENCES employees(id),
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'modified', 'escalated', 'returned')),
  comment TEXT,
  modification JSONB,
  acted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_approval_records_entity ON approval_records(entity_type, entity_id);
CREATE INDEX idx_approval_records_approver ON approval_records(approver_id);

-- updated_at triggers
CREATE TRIGGER trg_organizations_updated BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_departments_updated BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_employees_updated BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_number_sequences_updated BEFORE UPDATE ON number_sequences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_approval_rules_updated BEFORE UPDATE ON approval_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

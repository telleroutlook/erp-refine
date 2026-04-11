-- 007_finance.sql
-- GL accounts, vouchers, cost centers, budgets, payment records

-- Cost centers
CREATE TABLE public.cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES cost_centers(id),
  department_id UUID REFERENCES departments(id),
  manager_id UUID REFERENCES employees(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, code)
);

CREATE INDEX idx_cost_centers_org ON cost_centers(organization_id);

-- Account subjects (Chart of Accounts)
CREATE TABLE public.account_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES account_subjects(id),
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 6),
  category TEXT NOT NULL
    CHECK (category IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  balance_direction TEXT NOT NULL DEFAULT 'debit'
    CHECK (balance_direction IN ('debit', 'credit')),
  is_leaf BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, code)
);

CREATE INDEX idx_account_subjects_org ON account_subjects(organization_id);
CREATE INDEX idx_account_subjects_parent ON account_subjects(parent_id);
CREATE INDEX idx_account_subjects_category ON account_subjects(category);

-- Vouchers (journal entries)
CREATE TABLE public.vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  voucher_number TEXT NOT NULL,
  voucher_date DATE NOT NULL DEFAULT CURRENT_DATE,
  voucher_type TEXT NOT NULL DEFAULT 'transfer'
    CHECK (voucher_type IN ('receipt', 'payment', 'transfer')),
  total_debit NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (total_debit >= 0),
  total_credit NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (total_credit >= 0),
  description TEXT,
  reference_type TEXT,
  reference_id UUID,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'approved', 'posted', 'cancelled')),
  created_by UUID REFERENCES employees(id),
  approved_by UUID REFERENCES employees(id),
  approved_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, voucher_number)
);

CREATE INDEX idx_vouchers_org ON vouchers(organization_id);
CREATE INDEX idx_vouchers_date ON vouchers(voucher_date);
CREATE INDEX idx_vouchers_status ON vouchers(status);

-- Prevent editing posted vouchers
CREATE OR REPLACE FUNCTION fn_prevent_posted_voucher_edit()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'posted' AND NEW.status != 'cancelled' THEN
    RAISE EXCEPTION 'Cannot modify a posted voucher';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_voucher_protect BEFORE UPDATE ON vouchers
  FOR EACH ROW EXECUTE FUNCTION fn_prevent_posted_voucher_edit();

-- Voucher entries (debit/credit lines)
CREATE TABLE public.voucher_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
  account_subject_id UUID NOT NULL REFERENCES account_subjects(id),
  cost_center_id UUID REFERENCES cost_centers(id),
  entry_type TEXT NOT NULL CHECK (entry_type IN ('debit', 'credit')),
  amount NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  description TEXT,
  sequence INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_voucher_entries_voucher ON voucher_entries(voucher_id);
CREATE INDEX idx_voucher_entries_account ON voucher_entries(account_subject_id);

-- Auto-calculate voucher totals
CREATE OR REPLACE FUNCTION fn_update_voucher_totals()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE vouchers SET
    total_debit = COALESCE((
      SELECT SUM(amount) FROM voucher_entries
      WHERE voucher_id = COALESCE(NEW.voucher_id, OLD.voucher_id) AND entry_type = 'debit'
    ), 0),
    total_credit = COALESCE((
      SELECT SUM(amount) FROM voucher_entries
      WHERE voucher_id = COALESCE(NEW.voucher_id, OLD.voucher_id) AND entry_type = 'credit'
    ), 0)
  WHERE id = COALESCE(NEW.voucher_id, OLD.voucher_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_voucher_entries_calc AFTER INSERT OR UPDATE OR DELETE ON voucher_entries
  FOR EACH ROW EXECUTE FUNCTION fn_update_voucher_totals();

-- Budgets
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  budget_code TEXT NOT NULL,
  name TEXT NOT NULL,
  fiscal_year INTEGER NOT NULL,
  department_id UUID REFERENCES departments(id),
  cost_center_id UUID REFERENCES cost_centers(id),
  total_amount NUMERIC(18,2) NOT NULL CHECK (total_amount >= 0),
  currency TEXT DEFAULT 'CNY' REFERENCES currencies(currency_code),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'approved', 'active', 'closed')),
  approved_by UUID REFERENCES employees(id),
  approved_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, budget_code, fiscal_year)
);

CREATE INDEX idx_budgets_org ON budgets(organization_id);
CREATE INDEX idx_budgets_year ON budgets(fiscal_year);

-- Budget lines (breakdown by account/period)
CREATE TABLE public.budget_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  account_subject_id UUID NOT NULL REFERENCES account_subjects(id),
  period INTEGER NOT NULL CHECK (period >= 1 AND period <= 12),  -- month
  planned_amount NUMERIC(18,2) NOT NULL CHECK (planned_amount >= 0),
  actual_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (budget_id, account_subject_id, period)
);

CREATE INDEX idx_budget_lines_budget ON budget_lines(budget_id);

-- Payment records (both AP and AR)
CREATE TABLE public.payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  payment_number TEXT NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('receivable', 'payable')),
  partner_type TEXT NOT NULL CHECK (partner_type IN ('customer', 'supplier')),
  partner_id UUID NOT NULL,  -- polymorphic: customer or supplier
  amount NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'CNY' REFERENCES currencies(currency_code),
  payment_method TEXT DEFAULT 'bank_transfer',
  bank_reference TEXT,
  reference_type TEXT,  -- 'supplier_invoice', 'sales_invoice', etc.
  reference_id UUID,
  notes TEXT,
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, payment_number)
);

CREATE INDEX idx_payment_records_org ON payment_records(organization_id);
CREATE INDEX idx_payment_records_partner ON payment_records(partner_type, partner_id);
CREATE INDEX idx_payment_records_date ON payment_records(payment_date);

-- Triggers
CREATE TRIGGER trg_cost_centers_updated BEFORE UPDATE ON cost_centers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_account_subjects_updated BEFORE UPDATE ON account_subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_vouchers_updated BEFORE UPDATE ON vouchers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_budgets_updated BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_budget_lines_updated BEFORE UPDATE ON budget_lines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

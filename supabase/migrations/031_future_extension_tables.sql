-- 031: Future extension tables

-- 1. Workflow steps — define nodes in a workflow
CREATE TABLE IF NOT EXISTS workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  step_name TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  step_type TEXT NOT NULL DEFAULT 'approval',
  assignee_role TEXT,
  condition JSONB,
  action JSONB,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','in_progress','completed','skipped')),
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_workflow_steps_workflow ON workflow_steps(workflow_id, step_order);

-- 2. Approval rule steps — multi-level approval chains
CREATE TABLE IF NOT EXISTS approval_rule_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES approval_rules(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  approver_role TEXT NOT NULL,
  approval_type TEXT NOT NULL DEFAULT 'sequential'
    CHECK (approval_type IN ('sequential','parallel','any_one')),
  min_approvers INTEGER NOT NULL DEFAULT 1,
  timeout_hours INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (rule_id, step_order)
);

-- 3. Product cost history — weighted average / FIFO cost tracking
CREATE TABLE IF NOT EXISTS product_cost_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  product_id UUID NOT NULL REFERENCES products(id),
  cost_method TEXT NOT NULL DEFAULT 'weighted_average'
    CHECK (cost_method IN ('weighted_average','fifo','standard')),
  unit_cost NUMERIC(18,4) NOT NULL,
  total_quantity NUMERIC(18,4) NOT NULL,
  total_value NUMERIC(18,4) NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_product_cost_history_product ON product_cost_history(product_id, effective_date DESC);

-- 4. Shipment tracking events — shipment status timeline
CREATE TABLE IF NOT EXISTS shipment_tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  shipment_id UUID NOT NULL REFERENCES sales_shipments(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL
    CHECK (event_type IN ('picked_up','in_transit','out_for_delivery','delivered','exception','returned')),
  location TEXT,
  notes TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_shipment_tracking_shipment ON shipment_tracking_events(shipment_id, occurred_at);

-- 5. Import logs — batch import audit trail
CREATE TABLE IF NOT EXISTS import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  resource_type TEXT NOT NULL,
  file_name TEXT,
  total_rows INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  errors JSONB,
  status TEXT NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing','completed','failed')),
  imported_by UUID NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX idx_import_logs_org ON import_logs(organization_id, started_at DESC);

-- 6. RBAC tables
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, name)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  conditions JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (role_id, resource, action)
);

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  assigned_by UUID,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role_id, organization_id)
);
CREATE INDEX idx_user_roles_user ON user_roles(user_id, organization_id);

-- Enable RLS on new tables
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_rule_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_cost_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

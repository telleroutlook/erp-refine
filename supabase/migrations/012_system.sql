-- 012_system.sql
-- Tool registry, workflows, document attachments, notifications

-- Tool registry
CREATE TABLE public.tool_registry (
  tool_name TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  domain TEXT NOT NULL,  -- 'procurement', 'sales', 'inventory', etc.
  agent_type TEXT NOT NULL DEFAULT 'execution'
    CHECK (agent_type IN ('intent', 'schema_architect', 'execution', 'shared')),
  risk_level TEXT NOT NULL DEFAULT 'D0'
    CHECK (risk_level IN ('D0', 'D1', 'D2', 'D3', 'D4', 'D5')),
  requires_permission JSONB DEFAULT '[]',
  audit_required BOOLEAN NOT NULL DEFAULT FALSE,
  input_schema JSONB,
  output_schema JSONB,
  version TEXT NOT NULL DEFAULT '1.0.0',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workflows
CREATE TABLE public.workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  workflow_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  current_step INTEGER NOT NULL DEFAULT 0,
  total_steps INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'failed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workflows_org ON workflows(organization_id);
CREATE INDEX idx_workflows_entity ON workflows(entity_type, entity_id);
CREATE INDEX idx_workflows_status ON workflows(status);

-- Workflow executions (step history)
CREATE TABLE public.workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_id UUID REFERENCES employees(id),
  input_data JSONB,
  output_data JSONB,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'executing', 'completed', 'failed', 'skipped')),
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workflow_executions_workflow ON workflow_executions(workflow_id);

-- Document attachments
CREATE TABLE public.document_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,  -- R2 object key
  file_size BIGINT,
  mime_type TEXT,
  uploaded_by UUID REFERENCES employees(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_document_attachments_entity ON document_attachments(entity_type, entity_id);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  recipient_id UUID NOT NULL REFERENCES employees(id),
  title TEXT NOT NULL,
  body TEXT,
  notification_type TEXT NOT NULL DEFAULT 'info'
    CHECK (notification_type IN ('info', 'warning', 'action_required', 'approval', 'system')),
  entity_type TEXT,
  entity_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read);
CREATE INDEX idx_notifications_org ON notifications(organization_id);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- JSONB Dynamic Vault (for AI-generated dynamic forms)
CREATE TABLE public.dynamic_form_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  schema_registry_id UUID NOT NULL REFERENCES schema_registry(id),
  data JSONB NOT NULL DEFAULT '{}',
  is_sandbox BOOLEAN NOT NULL DEFAULT FALSE,  -- draft schema data isolation
  created_by UUID REFERENCES employees(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dynamic_form_data_org ON dynamic_form_data(organization_id);
CREATE INDEX idx_dynamic_form_data_schema ON dynamic_form_data(schema_registry_id);
CREATE INDEX idx_dynamic_form_data_sandbox ON dynamic_form_data(is_sandbox);

-- Triggers
CREATE TRIGGER trg_workflows_updated BEFORE UPDATE ON workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_dynamic_form_data_updated BEFORE UPDATE ON dynamic_form_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

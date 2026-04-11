-- 011_ai_governance.sql
-- Agent sessions, decisions, events, metrics, schema registry

-- Agent sessions
CREATE TABLE public.agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  session_type TEXT NOT NULL DEFAULT 'chat'
    CHECK (session_type IN ('chat', 'task', 'workflow', 'scheduled')),
  agent_type TEXT NOT NULL DEFAULT 'intent'
    CHECK (agent_type IN ('intent', 'schema_architect', 'execution', 'orchestrator')),
  user_id UUID REFERENCES employees(id),
  context JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'aborted', 'expired')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_sessions_org ON agent_sessions(organization_id);
CREATE INDEX idx_agent_sessions_user ON agent_sessions(user_id);
CREATE INDEX idx_agent_sessions_status ON agent_sessions(status);
CREATE INDEX idx_agent_sessions_created ON agent_sessions(created_at);

-- Agent decisions (immutable audit trail)
CREATE TABLE public.agent_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  session_id UUID REFERENCES agent_sessions(id),
  agent_type TEXT NOT NULL,
  agent_version TEXT,
  model_profile TEXT,
  trace_id TEXT,
  context_refs JSONB DEFAULT '[]',
  reasoning_summary JSONB,
  tools_called JSONB DEFAULT '[]',
  decision JSONB NOT NULL,
  risk_level TEXT NOT NULL DEFAULT 'D0'
    CHECK (risk_level IN ('D0', 'D1', 'D2', 'D3', 'D4', 'D5')),
  confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  human_approval_required BOOLEAN NOT NULL DEFAULT FALSE,
  approval_status TEXT NOT NULL DEFAULT 'na'
    CHECK (approval_status IN ('na', 'pending', 'approved', 'rejected', 'expired')),
  approver_id UUID REFERENCES employees(id),
  approved_at TIMESTAMPTZ,
  execution_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (execution_status IN ('pending', 'executing', 'success', 'failed', 'cancelled', 'blocked')),
  human_modification JSONB,
  outcome JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_decisions_org ON agent_decisions(organization_id);
CREATE INDEX idx_agent_decisions_session ON agent_decisions(session_id);
CREATE INDEX idx_agent_decisions_trace ON agent_decisions(trace_id);
CREATE INDEX idx_agent_decisions_risk ON agent_decisions(risk_level);
CREATE INDEX idx_agent_decisions_created ON agent_decisions(created_at);

-- Business events (immutable event sourcing)
CREATE TABLE public.business_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  event_type TEXT NOT NULL,
  event_version TEXT NOT NULL DEFAULT '1.0',
  source_system TEXT DEFAULT 'erp-refine',
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  correlation_id TEXT,
  causation_id TEXT,
  idempotency_key TEXT UNIQUE,
  actor_id UUID REFERENCES employees(id),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_business_events_org ON business_events(organization_id);
CREATE INDEX idx_business_events_entity ON business_events(entity_type, entity_id);
CREATE INDEX idx_business_events_type ON business_events(event_type);
CREATE INDEX idx_business_events_occurred ON business_events(occurred_at);
CREATE INDEX idx_business_events_correlation ON business_events(correlation_id);

-- Tool call metrics
CREATE TABLE public.tool_call_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  tool_name TEXT NOT NULL,
  session_id UUID REFERENCES agent_sessions(id),
  input_hash TEXT,
  duration_ms INTEGER,
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error_message TEXT,
  cache_hit BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tool_call_metrics_tool ON tool_call_metrics(tool_name);
CREATE INDEX idx_tool_call_metrics_created ON tool_call_metrics(created_at);

-- Token usage
CREATE TABLE public.token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  session_id UUID REFERENCES agent_sessions(id),
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
  cost_estimate NUMERIC(10,6) DEFAULT 0,
  variant TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_token_usage_session ON token_usage(session_id);
CREATE INDEX idx_token_usage_created ON token_usage(created_at);

-- Schema registry (UI schema version management)
CREATE TABLE public.schema_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  json_schema JSONB NOT NULL,
  ui_schema JSONB,
  data_mapping JSONB,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'archived')),
  version INTEGER NOT NULL DEFAULT 1,
  risk_score INTEGER DEFAULT 0,
  created_by UUID REFERENCES employees(id),
  activated_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  trace_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, slug, version)
);

CREATE INDEX idx_schema_registry_org ON schema_registry(organization_id);
CREATE INDEX idx_schema_registry_status ON schema_registry(status);
CREATE INDEX idx_schema_registry_slug ON schema_registry(slug);

-- Schema versions (history)
CREATE TABLE public.schema_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_registry_id UUID NOT NULL REFERENCES schema_registry(id),
  version INTEGER NOT NULL,
  json_schema JSONB NOT NULL,
  ui_schema JSONB,
  diff_from_previous JSONB,
  change_reason TEXT,
  changed_by UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_schema_versions_registry ON schema_versions(schema_registry_id);

-- Component whitelist
CREATE TABLE public.component_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  component_type TEXT NOT NULL,  -- 'input', 'select', 'date', 'table', etc.
  component_name TEXT NOT NULL,
  description TEXT,
  default_props JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_component_whitelist_org ON component_whitelist(organization_id);

-- Semantic metadata (LLM context for tables/columns)
CREATE TABLE public.semantic_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  column_name TEXT,
  version TEXT NOT NULL DEFAULT '1.0',
  display_name JSONB NOT NULL DEFAULT '{}',  -- {"zh-CN": "...", "en": "..."}
  description JSONB DEFAULT '{}',
  data_type TEXT,
  business_rules JSONB DEFAULT '[]',
  ai_hints JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (table_name, column_name, version)
);

-- Triggers
CREATE TRIGGER trg_schema_registry_updated BEFORE UPDATE ON schema_registry FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_semantic_metadata_updated BEFORE UPDATE ON semantic_metadata FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

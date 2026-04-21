// src/routes/admin-audit.ts
// Admin Audit REST API — read-only endpoints for system/AI observability tables

import { Hono } from 'hono';
import type { Context, Next } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware } from '../middleware/auth';
import { buildCrudRoutes, type CrudConfig } from '../utils/crud-factory';
import { ApiError } from '../utils/api-error';
import { ErrorCode } from '../types/errors';

const adminAudit = new Hono<{ Bindings: Env }>();
adminAudit.use('*', authMiddleware());

adminAudit.use('*', async (c: Context<{ Bindings: Env }>, next: Next) => {
  const user = c.get('user');
  if (user.role !== 'admin') {
    throw new ApiError({
      code: ErrorCode.FORBIDDEN,
      detail: 'Admin access required.',
      requestId: c.get('requestId'),
    });
  }
  await next();
});

// ---------------------------------------------------------------------------
// Token Usage — AI token consumption tracking
// ---------------------------------------------------------------------------
const tokenUsageConfig: CrudConfig = {
  table: 'token_usage',
  path: '/token-usage',
  resourceName: 'TokenUsage',
  listSelect: 'id, session_id, model, variant, input_tokens, output_tokens, total_tokens, cost_estimate, created_at',
  detailSelect: '*',
  createReturnSelect: 'id',
  defaultSort: 'created_at',
  softDelete: false,
  orgScoped: true,
  disableCreate: true,
  disableUpdate: true,
  disableDelete: true,
};
adminAudit.route('', buildCrudRoutes(tokenUsageConfig));

// ---------------------------------------------------------------------------
// Tool Call Metrics — AI tool call analytics
// ---------------------------------------------------------------------------
const toolCallMetricsConfig: CrudConfig = {
  table: 'tool_call_metrics',
  path: '/tool-call-metrics',
  resourceName: 'ToolCallMetric',
  listSelect: 'id, session_id, tool_name, success, cache_hit, duration_ms, error_message, created_at',
  detailSelect: '*',
  createReturnSelect: 'id',
  defaultSort: 'created_at',
  softDelete: false,
  orgScoped: true,
  disableCreate: true,
  disableUpdate: true,
  disableDelete: true,
};
adminAudit.route('', buildCrudRoutes(toolCallMetricsConfig));

// ---------------------------------------------------------------------------
// Agent Sessions — AI agent session audit
// ---------------------------------------------------------------------------
const agentSessionsConfig: CrudConfig = {
  table: 'agent_sessions',
  path: '/agent-sessions',
  resourceName: 'AgentSession',
  listSelect: 'id, agent_id, session_type, user_id, status, message_count, started_at, ended_at, created_at',
  detailSelect: '*',
  createReturnSelect: 'id',
  defaultSort: 'created_at',
  softDelete: false,
  orgScoped: true,
  disableCreate: true,
  disableUpdate: true,
  disableDelete: true,
};
adminAudit.route('', buildCrudRoutes(agentSessionsConfig));

// ---------------------------------------------------------------------------
// Agent Decisions — AI agent decision audit
// ---------------------------------------------------------------------------
const agentDecisionsConfig: CrudConfig = {
  table: 'agent_decisions',
  path: '/agent-decisions',
  resourceName: 'AgentDecision',
  listSelect: 'id, agent_id, session_id, risk_level, approval_status, execution_status, confidence, model_profile, created_at',
  detailSelect: '*',
  createReturnSelect: 'id',
  defaultSort: 'created_at',
  softDelete: false,
  orgScoped: true,
  disableCreate: true,
  disableUpdate: true,
  disableDelete: true,
};
adminAudit.route('', buildCrudRoutes(agentDecisionsConfig));

// ---------------------------------------------------------------------------
// Business Events — event bus audit log
// ---------------------------------------------------------------------------
const businessEventsConfig: CrudConfig = {
  table: 'business_events',
  path: '/business-events',
  resourceName: 'BusinessEvent',
  listSelect: 'id, event_type, entity_type, entity_id, severity, source_system, processed, occurred_at',
  detailSelect: '*',
  createReturnSelect: 'id',
  defaultSort: 'occurred_at',
  softDelete: false,
  orgScoped: true,
  disableCreate: true,
  disableUpdate: true,
  disableDelete: true,
};
adminAudit.route('', buildCrudRoutes(businessEventsConfig));

// ---------------------------------------------------------------------------
// Auth Events — authentication event audit
// ---------------------------------------------------------------------------
const authEventsConfig: CrudConfig = {
  table: 'auth_events',
  path: '/auth-events',
  resourceName: 'AuthEvent',
  listSelect: 'id, event_type, user_id, ip_address, user_agent, created_at',
  detailSelect: '*',
  createReturnSelect: 'id',
  defaultSort: 'created_at',
  softDelete: false,
  orgScoped: true,
  disableCreate: true,
  disableUpdate: true,
  disableDelete: true,
};
adminAudit.route('', buildCrudRoutes(authEventsConfig));

// ---------------------------------------------------------------------------
// Failed Login Attempts — security audit (not org-scoped)
// ---------------------------------------------------------------------------
const failedLoginAttemptsConfig: CrudConfig = {
  table: 'failed_login_attempts',
  path: '/failed-login-attempts',
  resourceName: 'FailedLoginAttempt',
  listSelect: 'id, username, ip_address, reason, created_at',
  detailSelect: '*',
  createReturnSelect: 'id',
  defaultSort: 'created_at',
  softDelete: false,
  orgScoped: false,
  disableCreate: true,
  disableUpdate: true,
  disableDelete: true,
};
adminAudit.route('', buildCrudRoutes(failedLoginAttemptsConfig));

// ---------------------------------------------------------------------------
// Import Logs — data import audit trail
// ---------------------------------------------------------------------------
const importLogsConfig: CrudConfig = {
  table: 'import_logs',
  path: '/import-logs',
  resourceName: 'ImportLog',
  listSelect: 'id, resource_type, file_name, status, total_rows, success_count, error_count, imported_by, started_at, completed_at',
  detailSelect: '*',
  createReturnSelect: 'id',
  defaultSort: 'started_at',
  softDelete: false,
  orgScoped: true,
  disableCreate: true,
  disableUpdate: true,
  disableDelete: true,
};
adminAudit.route('', buildCrudRoutes(importLogsConfig));

// ---------------------------------------------------------------------------
// Portal Users — supplier/customer portal accounts (read-only for admin)
// ---------------------------------------------------------------------------
const portalUsersConfig: CrudConfig = {
  table: 'portal_users',
  path: '/portal-users',
  resourceName: 'PortalUser',
  listSelect: 'id, username, role, status, supplier_id, last_login_at, created_at',
  detailSelect: 'id, username, role, status, supplier_id, last_login_at, password_changed_at, created_at, updated_at, deleted_at',
  createReturnSelect: 'id',
  defaultSort: 'created_at',
  softDelete: true,
  orgScoped: false,
  disableCreate: true,
  disableUpdate: true,
  disableDelete: true,
};
adminAudit.route('', buildCrudRoutes(portalUsersConfig));

// ---------------------------------------------------------------------------
// Semantic Metadata — NLP metadata store (not org-scoped)
// ---------------------------------------------------------------------------
const semanticMetadataConfig: CrudConfig = {
  table: 'semantic_metadata',
  path: '/semantic-metadata',
  resourceName: 'SemanticMetadata',
  listSelect: 'id, table_name, column_name, display_name, data_type, description, version, created_at',
  detailSelect: '*',
  createReturnSelect: 'id',
  defaultSort: 'table_name',
  softDelete: false,
  orgScoped: false,
  disableCreate: true,
  disableUpdate: true,
  disableDelete: true,
};
adminAudit.route('', buildCrudRoutes(semanticMetadataConfig));

// ---------------------------------------------------------------------------
// Component Whitelist — UI component registry (not org-scoped)
// ---------------------------------------------------------------------------
const componentWhitelistConfig: CrudConfig = {
  table: 'component_whitelist',
  path: '/component-whitelist',
  resourceName: 'ComponentWhitelist',
  listSelect: 'id, component_name, component_type, description, allowed_roles, created_at',
  detailSelect: '*',
  createReturnSelect: 'id',
  defaultSort: 'component_name',
  softDelete: false,
  orgScoped: false,
  disableCreate: true,
  disableUpdate: true,
  disableDelete: true,
};
adminAudit.route('', buildCrudRoutes(componentWhitelistConfig));

// ---------------------------------------------------------------------------
// Schema Versions — schema version history (not org-scoped)
// ---------------------------------------------------------------------------
const schemaVersionsConfig: CrudConfig = {
  table: 'schema_versions',
  path: '/schema-versions',
  resourceName: 'SchemaVersion',
  listSelect: 'id, schema_id, version, created_by, created_at',
  detailSelect: '*',
  createReturnSelect: 'id',
  defaultSort: 'created_at',
  softDelete: false,
  orgScoped: false,
  parentOwnership: { parentFk: 'schema_id', parentTable: 'schema_registry' },
  disableCreate: true,
  disableUpdate: true,
  disableDelete: true,
};
adminAudit.route('', buildCrudRoutes(schemaVersionsConfig));

export default adminAudit;

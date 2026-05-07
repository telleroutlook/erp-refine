// src/tools/audit-tools.ts
// Audit & monitoring domain tools (D0 — read-only)

import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

export function createAuditTools(db: SupabaseClient, organizationId: string) {
  return {
    list_token_usage: tool({
      description: 'List AI token consumption records — useful for cost tracking and usage analytics',
      inputSchema: z.object({
        model: z.string().optional().describe('Filter by model name, e.g. claude-sonnet'),
        sessionId: z.string().uuid().optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ model, sessionId, limit }) => {
        let query = db
          .from('token_usage')
          .select('id, session_id, model, variant, input_tokens, output_tokens, total_tokens, cost_estimate, created_at')
          .eq('organization_id', organizationId);

        if (model) query = query.ilike('model', `%${model}%`);
        if (sessionId) query = query.eq('session_id', sessionId);

        const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_tool_call_metrics: tool({
      description: 'List AI tool call metrics — success rates, durations, cache hits',
      inputSchema: z.object({
        toolName: z.string().optional().describe('Filter by tool name'),
        successOnly: z.boolean().optional().describe('Only show successful calls'),
        sessionId: z.string().uuid().optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ toolName, successOnly, sessionId, limit }) => {
        let query = db
          .from('tool_call_metrics')
          .select('id, session_id, tool_name, success, cache_hit, duration_ms, error_message, created_at')
          .eq('organization_id', organizationId);

        if (toolName) query = query.eq('tool_name', toolName);
        if (successOnly !== undefined) query = query.eq('success', successOnly);
        if (sessionId) query = query.eq('session_id', sessionId);

        const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_agent_sessions: tool({
      description: 'List AI agent sessions — tracks conversation history and status',
      inputSchema: z.object({
        status: z.enum(['active', 'completed', 'error']).optional(),
        agentId: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ status, agentId, limit }) => {
        let query = db
          .from('agent_sessions')
          .select('id, agent_id, session_type, user_id, status, message_count, started_at, ended_at, created_at')
          .eq('organization_id', organizationId);

        if (status) query = query.eq('status', status);
        if (agentId) query = query.eq('agent_id', agentId);

        const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_agent_decisions: tool({
      description: 'List AI agent decisions — audit trail for AI actions with risk levels and approval status',
      inputSchema: z.object({
        riskLevel: z.enum(['D0', 'D1', 'D2', 'D3', 'D4', 'D5']).optional(),
        approvalStatus: z.string().optional().describe('e.g. approved, rejected, pending'),
        sessionId: z.string().uuid().optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ riskLevel, approvalStatus, sessionId, limit }) => {
        let query = db
          .from('agent_decisions')
          .select('id, agent_id, session_id, risk_level, approval_status, execution_status, confidence, model_profile, created_at')
          .eq('organization_id', organizationId);

        if (riskLevel) query = query.eq('risk_level', riskLevel);
        if (approvalStatus) query = query.eq('approval_status', approvalStatus);
        if (sessionId) query = query.eq('session_id', sessionId);

        const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_business_events: tool({
      description: 'List business events from the event bus — entity lifecycle events, severity tracking',
      inputSchema: z.object({
        eventType: z.string().optional().describe('e.g. status_changed, created, deleted'),
        entityType: z.string().optional().describe('e.g. purchase_orders, sales_orders'),
        severity: z.enum(['info', 'warning', 'error', 'critical']).optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ eventType, entityType, severity, limit }) => {
        let query = db
          .from('business_events')
          .select('id, event_type, entity_type, entity_id, severity, source_system, processed, occurred_at')
          .eq('organization_id', organizationId);

        if (eventType) query = query.eq('event_type', eventType);
        if (entityType) query = query.eq('entity_type', entityType);
        if (severity) query = query.eq('severity', severity);

        const { data, error } = await query.order('occurred_at', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_auth_events: tool({
      description: 'List authentication events — login/logout/token-refresh tracking',
      inputSchema: z.object({
        eventType: z.string().optional().describe('e.g. login, logout, token_refresh, password_reset'),
        userId: z.string().uuid().optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ eventType, userId, limit }) => {
        let query = db
          .from('auth_events')
          .select('id, event_type, user_id, ip_address, user_agent, created_at')
          .eq('organization_id', organizationId);

        if (eventType) query = query.eq('event_type', eventType);
        if (userId) query = query.eq('user_id', userId);

        const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_failed_login_attempts: tool({
      description: 'List failed login attempts — security monitoring for brute-force detection',
      inputSchema: z.object({
        username: z.string().optional(),
        ipAddress: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ username, ipAddress, limit }) => {
        let query = db
          .from('failed_login_attempts')
          .select('id, username, ip_address, reason, created_at');

        if (username) query = query.ilike('username', `%${username}%`);
        if (ipAddress) query = query.eq('ip_address', ipAddress);

        const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_import_logs: tool({
      description: 'List data import history — tracks bulk import jobs and their outcomes',
      inputSchema: z.object({
        resourceType: z.string().optional().describe('e.g. products, customers, suppliers'),
        status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ resourceType, status, limit }) => {
        let query = db
          .from('import_logs')
          .select('id, resource_type, file_name, status, total_rows, success_count, error_count, imported_by, started_at, completed_at')
          .eq('organization_id', organizationId);

        if (resourceType) query = query.eq('resource_type', resourceType);
        if (status) query = query.eq('status', status);

        const { data, error } = await query.order('started_at', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),
  };
}

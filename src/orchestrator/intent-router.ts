// src/orchestrator/intent-router.ts
// Routes user intent to the appropriate agent pipeline

import type { RequirementSpec } from '../agents/intent-agent';

export type AgentPipeline = 'query' | 'schema-generation' | 'execution';

export interface RoutingDecision {
  pipeline: AgentPipeline;
  reason: string;
}

/** Decide which pipeline to invoke based on the parsed intent spec */
export function routeIntent(spec: RequirementSpec): RoutingDecision {
  const action = spec.action.toLowerCase();

  // Pure queries → only Intent + Execution (query-only tools)
  const queryVerbs = ['get', 'list', 'search', 'query', 'check', 'view', 'show', 'find', 'report', 'analyze', 'summarize', 'summary', 'calculate', 'count', 'compare', 'forecast', 'review', 'track'];
  const isQuery = queryVerbs.some((v) => action.startsWith(v) || action.includes(`_${v}`))
    || action.includes('analysis') || action.includes('analytics') || action.includes('overview') || action.includes('dashboard');
  if (isQuery) {
    return { pipeline: 'query', reason: 'Read-only action, no schema or write needed' };
  }

  // Schema/form creation → Intent + Schema Architect
  const schemaVerbs = ['create_form', 'generate_form', 'add_field', 'design_ui', 'create_custom'];
  if (schemaVerbs.some((v) => action.includes(v)) || spec.intent.includes('form') || spec.intent.includes('schema')) {
    return { pipeline: 'schema-generation', reason: 'UI/form generation requested' };
  }

  // Write operations → Intent + Execution (with policy gating)
  return { pipeline: 'execution', reason: 'Write operation, route to Execution Agent' };
}

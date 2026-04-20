// src/orchestrator/intent-router.ts
// Routes user intent to the appropriate agent pipeline with strategy-based routing

import type { RequirementSpec } from '../agents/intent-agent';

export type AgentPipeline = 'query' | 'schema-generation' | 'execution';

export interface RoutingDecision {
  pipeline: AgentPipeline;
  reason: string;
  strategy: AgentStrategy;
}

export interface AgentStrategy {
  name: string;
  toolFilter?: string[];   // undefined = all tools allowed
  stepLimit: number;
  temperature: number;
  maxOutputTokens: number;
  promptSuffix: string;
}

const STRATEGIES: Array<{
  name: string;
  match: (action: string, spec: RequirementSpec) => boolean;
  strategy: AgentStrategy;
}> = [
  {
    name: 'cross-verify',
    match: (action, spec) =>
      /verify|核实|确认|是否正确|真的吗|对不对|fact.*check/i.test(spec.intent)
      || /verify|cross_check/i.test(action),
    strategy: {
      name: 'cross-verify',
      stepLimit: 2,
      temperature: 0.1,
      maxOutputTokens: 2048,
      promptSuffix: '这是核实/验证类任务。请先通过工具查询数据后再给出判断，不要依赖推断。',
    },
  },
  {
    name: 'deep-analysis',
    match: (action, spec) =>
      /分析|汇总|总结|报告|趋势|对比|预测|analysis|summary|report|compare|forecast/i.test(spec.intent)
      || action.includes('analysis') || action.includes('analytics') || action.includes('summary'),
    strategy: {
      name: 'deep-analysis',
      stepLimit: 5,
      temperature: 0.3,
      maxOutputTokens: 4096,
      promptSuffix: '这是深度分析任务。请先通过工具收集数据，再综合分析，给出结构化的分析报告。',
    },
  },
  {
    name: 'calculation',
    match: (action, spec) =>
      /计算|统计|合计|汇总金额|calculate|compute|count|total/i.test(spec.intent)
      || /calculate|compute|count_/i.test(action),
    strategy: {
      name: 'calculation',
      stepLimit: 3,
      temperature: 0.0,
      maxOutputTokens: 2048,
      promptSuffix: '这是计算/统计任务。请精确调用工具获取数据，结果以数字形式呈现，保留两位小数。',
    },
  },
  {
    name: 'write-operation',
    match: (action) =>
      /create|update|delete|submit|approve|cancel|close|post/i.test(action),
    strategy: {
      name: 'write-operation',
      stepLimit: 3,
      temperature: 0.1,
      maxOutputTokens: 2048,
      promptSuffix: '这是写操作任务。执行前请确认参数完整，操作成功后返回创建/更新的记录摘要。',
    },
  },
  {
    name: 'general-query',
    match: () => true,
    strategy: {
      name: 'general-query',
      stepLimit: 4,
      temperature: 0.3,
      maxOutputTokens: 3000,
      promptSuffix: '根据用户需求调用最相关的工具，返回简洁清晰的结果。',
    },
  },
];

function selectStrategy(action: string, spec: RequirementSpec): AgentStrategy {
  for (const entry of STRATEGIES) {
    if (entry.match(action, spec)) return entry.strategy;
  }
  // STRATEGIES always has a catch-all 'general-query' entry, this is a safe fallback
  return STRATEGIES[STRATEGIES.length - 1]!.strategy;
}

/** Decide which pipeline to invoke based on the parsed intent spec */
export function routeIntent(spec: RequirementSpec): RoutingDecision {
  const action = spec.action.toLowerCase();

  // Schema/form creation → Intent + Schema Architect
  const schemaVerbs = ['create_form', 'generate_form', 'add_field', 'design_ui', 'create_custom'];
  if (schemaVerbs.some((v) => action.includes(v)) || spec.intent.includes('form') || spec.intent.includes('schema')) {
    return {
      pipeline: 'schema-generation',
      reason: 'UI/form generation requested',
      strategy: { name: 'schema', stepLimit: 1, temperature: 0.2, maxOutputTokens: 4096, promptSuffix: '' },
    };
  }

  // Pure queries → only Intent + Execution (query-only tools)
  const queryVerbs = ['get', 'list', 'search', 'query', 'check', 'view', 'show', 'find', 'report',
    'analyze', 'summarize', 'summary', 'calculate', 'count', 'compare', 'forecast', 'review', 'track'];
  const isQuery = queryVerbs.some((v) => action.startsWith(v) || action.includes(`_${v}`))
    || action.includes('analysis') || action.includes('analytics')
    || action.includes('overview') || action.includes('dashboard');

  const strategy = selectStrategy(action, spec);

  if (isQuery) {
    return { pipeline: 'query', reason: 'Read-only action, no schema or write needed', strategy };
  }

  return { pipeline: 'execution', reason: 'Write operation, route to Execution Agent', strategy };
}

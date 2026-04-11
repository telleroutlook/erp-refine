// src/policy/policy-engine.ts
// Centralized policy engine — condition → action mapping, default-safe

import { DecisionLevel, DENY_KEYWORDS } from './risk-levels';

export interface PolicyContext {
  action: string;         // e.g. 'create_purchase_order'
  domain: string;         // e.g. 'procurement'
  userId: string;
  role: string;
  organizationId: string;
  confirmed?: boolean;    // User explicitly confirmed D2 action
  approved?: boolean;     // Manager approved D3 action
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

export type PolicyDecision = 'allow' | 'deny' | 'require_confirmation' | 'require_approval';

export interface PolicyResult {
  decision: PolicyDecision;
  level: DecisionLevel;
  reason: string;
  requiresConfirmation: boolean;
  requiresApproval: boolean;
}

export interface PolicyRule {
  id: string;
  domain?: string;
  actionPattern: RegExp | string;
  level: DecisionLevel;
  roles?: string[];       // if set, only these roles can execute
  check?: (ctx: PolicyContext) => boolean;
}

const REGISTERED_RULES: PolicyRule[] = [];

export function registerRule(rule: PolicyRule): void {
  REGISTERED_RULES.push(rule);
}

export function evaluatePolicy(ctx: PolicyContext): PolicyResult {
  const action = ctx.action.toLowerCase();

  // 1. Check deny keywords — immediate deny
  for (const kw of DENY_KEYWORDS) {
    if (action.includes(kw) && !REGISTERED_RULES.some((r) => matchesRule(r, ctx))) {
      return {
        decision: 'deny',
        level: DecisionLevel.D5,
        reason: `Action contains denied keyword: ${kw}`,
        requiresConfirmation: false,
        requiresApproval: false,
      };
    }
  }

  // 2. Find matching rule
  const rule = REGISTERED_RULES.find((r) => matchesRule(r, ctx));

  // 3. No rule found — apply default policy
  if (!rule) {
    const isWrite = isWriteAction(action);
    if (!isWrite) {
      return allow(DecisionLevel.D0, 'Default: read-only action auto-approved');
    }
    return {
      decision: 'deny',
      level: DecisionLevel.D5,
      reason: 'No policy registered for this write action',
      requiresConfirmation: false,
      requiresApproval: false,
    };
  }

  // 4. Role check
  if (rule.roles && !rule.roles.includes(ctx.role)) {
    return {
      decision: 'deny',
      level: rule.level,
      reason: `Role '${ctx.role}' is not authorized for this action`,
      requiresConfirmation: false,
      requiresApproval: false,
    };
  }

  // 5. Custom check
  if (rule.check && !rule.check(ctx)) {
    return {
      decision: 'deny',
      level: rule.level,
      reason: 'Custom policy check failed',
      requiresConfirmation: false,
      requiresApproval: false,
    };
  }

  // 6. Level-based routing
  if (rule.level === DecisionLevel.D0 || rule.level === DecisionLevel.D1) {
    return allow(rule.level, `Rule '${rule.id}' auto-approved`);
  }

  if (rule.level === DecisionLevel.D2) {
    if (ctx.confirmed) return allow(DecisionLevel.D2, `Rule '${rule.id}' confirmed by user`);
    return {
      decision: 'require_confirmation',
      level: DecisionLevel.D2,
      reason: `Rule '${rule.id}' requires user confirmation`,
      requiresConfirmation: true,
      requiresApproval: false,
    };
  }

  if (rule.level === DecisionLevel.D3) {
    if (ctx.approved) return allow(DecisionLevel.D3, `Rule '${rule.id}' approved`);
    return {
      decision: 'require_approval',
      level: DecisionLevel.D3,
      reason: `Rule '${rule.id}' requires formal approval`,
      requiresConfirmation: false,
      requiresApproval: true,
    };
  }

  if (rule.level === DecisionLevel.D5) {
    return {
      decision: 'deny',
      level: DecisionLevel.D5,
      reason: `Rule '${rule.id}' explicitly denies AI execution`,
      requiresConfirmation: false,
      requiresApproval: false,
    };
  }

  return allow(rule.level, `Rule '${rule.id}' allowed`);
}

function allow(level: DecisionLevel, reason: string): PolicyResult {
  return {
    decision: 'allow',
    level,
    reason,
    requiresConfirmation: false,
    requiresApproval: false,
  };
}

function matchesRule(rule: PolicyRule, ctx: PolicyContext): boolean {
  if (rule.domain && rule.domain !== ctx.domain) return false;
  if (typeof rule.actionPattern === 'string') {
    return ctx.action.toLowerCase() === rule.actionPattern.toLowerCase();
  }
  return rule.actionPattern.test(ctx.action);
}

function isWriteAction(action: string): boolean {
  const writeVerbs = [
    'create', 'update', 'delete', 'insert', 'post', 'submit',
    'approve', 'reject', 'cancel', 'close', 'archive', 'void',
    'reverse', 'pay', 'receive', 'ship', 'confirm',
  ];
  return writeVerbs.some((v) => action.includes(v));
}

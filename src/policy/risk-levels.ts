// src/policy/risk-levels.ts
// D0-D5 Decision level definitions

export const DecisionLevel = {
  D0: 0,  // Pure query/explain — auto-approve
  D1: 1,  // Generate suggestions/drafts — auto-approve
  D2: 2,  // Draft execution — requires user confirmation
  D3: 3,  // Formal approval required
  D4: 4,  // Controlled auto-execution (Phase 2+)
  D5: 5,  // Forbidden for AI execution
} as const;

export type DecisionLevel = (typeof DecisionLevel)[keyof typeof DecisionLevel];

export const DECISION_LEVEL_LABELS: Record<number, string> = {
  0: 'D0: Auto-approved (query)',
  1: 'D1: Auto-approved (suggestion)',
  2: 'D2: Requires confirmation',
  3: 'D3: Requires approval',
  4: 'D4: Controlled auto-execution',
  5: 'D5: Forbidden',
};

/** Keywords that trigger D2+ by default for write operations */
export const WRITE_TRIGGER_KEYWORDS = [
  'create', 'insert', 'update', 'delete', 'archive', 'close',
  'submit', 'approve', 'reject', 'confirm', 'cancel',
  'post', 'void', 'reverse', 'pay', 'receive', 'ship',
  'transfer', 'activate', 'terminate', 'renew', 'complete', 'issue',
] as const;

/** Keywords that trigger deny by default */
export const DENY_KEYWORDS = [
  'workflow', 'batch', 'bulk', 'mass',
] as const;

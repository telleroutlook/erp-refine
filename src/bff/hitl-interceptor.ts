// src/bff/hitl-interceptor.ts
// Human-in-the-Loop interceptor — routes D2/D3 actions through confirmation/approval

import type { PolicyResult } from '../policy/policy-engine';
import { DecisionLevel } from '../policy/risk-levels';

export interface HITLRequest {
  sessionId: string;
  action: string;
  domain: string;
  parameters: Record<string, unknown>;
  policyResult: PolicyResult;
}

export interface HITLResponse {
  proceed: boolean;
  requiresConfirmation: boolean;
  requiresApproval: boolean;
  prompt?: string;
  approvalRequestId?: string;
}

export function evaluateHITL(req: HITLRequest): HITLResponse {
  const { policyResult } = req;

  if (policyResult.decision === 'allow') {
    return { proceed: true, requiresConfirmation: false, requiresApproval: false };
  }

  if (policyResult.decision === 'require_confirmation') {
    return {
      proceed: false,
      requiresConfirmation: true,
      requiresApproval: false,
      prompt: buildConfirmationPrompt(req),
    };
  }

  if (policyResult.decision === 'require_approval') {
    return {
      proceed: false,
      requiresConfirmation: false,
      requiresApproval: true,
      prompt: buildApprovalPrompt(req),
      approvalRequestId: crypto.randomUUID(),
    };
  }

  // deny
  return { proceed: false, requiresConfirmation: false, requiresApproval: false };
}

function buildConfirmationPrompt(req: HITLRequest): string {
  const paramSummary = Object.entries(req.parameters)
    .slice(0, 5)
    .map(([k, v]) => `  • ${k}: ${JSON.stringify(v)}`)
    .join('\n');

  return `Please confirm the following action:\n\nAction: ${req.action}\nDomain: ${req.domain}\nParameters:\n${paramSummary}\n\nClick "Confirm" to proceed or "Cancel" to abort.`;
}

function buildApprovalPrompt(req: HITLRequest): string {
  return `This action (${req.action}) requires formal approval from a manager.\n\nAn approval request has been created and sent to the appropriate approver.`;
}

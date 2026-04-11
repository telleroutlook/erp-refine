// src/bff/risk-scorer.ts
// Risk scoring engine for Schema diffs

import type { SchemaOutput } from '../agents/schema-architect-agent';

export interface RiskScore {
  score: number;        // 0-100
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  autoApprove: boolean;
}

const SENSITIVE_FIELDS = ['password', 'secret', 'key', 'token', 'credit_card', 'ssn', 'bank_account'];
const FINANCIAL_FIELDS = ['amount', 'price', 'cost', 'salary', 'budget', 'total', 'tax'];
const PERMISSION_FIELDS = ['role', 'permission', 'access', 'admin'];

export function scoreSchema(schema: SchemaOutput): RiskScore {
  const factors: string[] = [];
  let score = 0;

  const allFields = [
    ...(schema.schemaDiff.addFields ?? []),
    ...(schema.schemaDiff.modifyFields ?? []),
  ];

  const fieldNames = allFields.map((f) => f.name.toLowerCase());

  // Sensitive fields
  for (const sensitive of SENSITIVE_FIELDS) {
    if (fieldNames.some((n) => n.includes(sensitive))) {
      score += 40;
      factors.push(`Contains sensitive field matching '${sensitive}'`);
    }
  }

  // Financial fields
  const financialMatches = FINANCIAL_FIELDS.filter((f) => fieldNames.some((n) => n.includes(f)));
  if (financialMatches.length > 0) {
    score += 20;
    factors.push(`Contains financial fields: ${financialMatches.join(', ')}`);
  }

  // Permission-related fields
  const permissionMatches = PERMISSION_FIELDS.filter((f) => fieldNames.some((n) => n.includes(f)));
  if (permissionMatches.length > 0) {
    score += 30;
    factors.push(`Contains permission-related fields: ${permissionMatches.join(', ')}`);
  }

  // Many fields = higher risk
  if (allFields.length > 20) {
    score += 15;
    factors.push(`Large schema (${allFields.length} fields)`);
  }

  // Existing table modification = higher risk
  if (schema.schemaDiff.storage === 'existing_table') {
    score += 20;
    factors.push('Modifies existing database table');
  }

  // Agent-assessed risk
  if (schema.schemaDiff.riskLevel === 'high') {
    score += 20;
    factors.push('Agent assessed risk as high');
  } else if (schema.schemaDiff.riskLevel === 'medium') {
    score += 10;
    factors.push('Agent assessed risk as medium');
  }

  const level =
    score >= 70 ? 'critical' :
    score >= 40 ? 'high' :
    score >= 20 ? 'medium' : 'low';

  return {
    score: Math.min(score, 100),
    level,
    factors,
    autoApprove: level === 'low',
  };
}

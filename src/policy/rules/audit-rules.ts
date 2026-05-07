// src/policy/rules/audit-rules.ts
// Policy rules for the audit domain — restrict sensitive security data to admin/manager

import { registerRule } from '../policy-engine';
import { DecisionLevel } from '../risk-levels';

registerRule({ id: 'audit.query', domain: 'audit', actionPattern: /^(get|list|search|query|check)/, level: DecisionLevel.D0, roles: ['admin', 'manager'] });

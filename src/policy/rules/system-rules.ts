// src/policy/rules/system-rules.ts
// Policy rules for the system domain (workflows, notifications, approvals, etc.)

import { registerRule } from '../policy-engine';
import { DecisionLevel } from '../risk-levels';

registerRule({ id: 'system.query', domain: 'system', actionPattern: /^(get|list|search|query|check)/, level: DecisionLevel.D0 });

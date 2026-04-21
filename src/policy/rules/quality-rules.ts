// src/policy/rules/quality-rules.ts
// Policy rules for the quality domain

import { registerRule } from '../policy-engine';
import { DecisionLevel } from '../risk-levels';

registerRule({ id: 'quality.query', domain: 'quality', actionPattern: /^(get|list|search|query|check)/, level: DecisionLevel.D0 });
registerRule({ id: 'quality.create_inspection', domain: 'quality', actionPattern: 'create_quality_inspection', level: DecisionLevel.D2, roles: ['admin', 'quality_manager', 'manufacturing_manager'] });
registerRule({ id: 'quality.complete_inspection', domain: 'quality', actionPattern: 'complete_quality_inspection', level: DecisionLevel.D3, roles: ['admin', 'quality_manager'] });

// src/policy/rules/manufacturing-rules.ts
// Policy rules for the manufacturing domain

import { registerRule } from '../policy-engine';
import { DecisionLevel } from '../risk-levels';

registerRule({ id: 'manufacturing.query', domain: 'manufacturing', actionPattern: /^(get|list|search|query|check)/, level: DecisionLevel.D0 });
registerRule({ id: 'manufacturing.create_work_order', domain: 'manufacturing', actionPattern: 'create_work_order', level: DecisionLevel.D2, roles: ['admin', 'manager', 'manufacturing_manager'] });
registerRule({ id: 'manufacturing.issue_materials', domain: 'manufacturing', actionPattern: 'issue_work_order_materials', level: DecisionLevel.D2, roles: ['admin', 'manufacturing_manager', 'inventory_manager'] });
registerRule({ id: 'manufacturing.complete_work_order', domain: 'manufacturing', actionPattern: 'complete_work_order', level: DecisionLevel.D3, roles: ['admin', 'manufacturing_manager'] });

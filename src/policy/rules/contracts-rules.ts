// src/policy/rules/contracts-rules.ts
// Policy rules for the contracts domain

import { registerRule } from '../policy-engine';
import { DecisionLevel } from '../risk-levels';

registerRule({ id: 'contracts.query', domain: 'contracts', actionPattern: /^(get|list|search|query|check)/, level: DecisionLevel.D0 });
registerRule({ id: 'contracts.activate', domain: 'contracts', actionPattern: 'activate_contract', level: DecisionLevel.D2, roles: ['admin', 'manager', 'sales_manager', 'procurement_manager'] });
registerRule({ id: 'contracts.terminate', domain: 'contracts', actionPattern: 'terminate_contract', level: DecisionLevel.D3, roles: ['admin', 'manager'] });

// src/policy/rules/inventory-rules.ts
// Policy rules for the inventory domain

import { registerRule } from '../policy-engine';
import { DecisionLevel } from '../risk-levels';

registerRule({ id: 'inventory.query', domain: 'inventory', actionPattern: /^(get|list|search|query|check)/, level: DecisionLevel.D0 });
registerRule({ id: 'inventory.transfer_stock', domain: 'inventory', actionPattern: 'transfer_stock', level: DecisionLevel.D2, roles: ['admin', 'warehouse_manager', 'inventory_manager'] });

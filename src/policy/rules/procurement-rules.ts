// src/policy/rules/procurement-rules.ts
// Policy rules for the procurement domain

import { registerRule } from '../policy-engine';
import { DecisionLevel } from '../risk-levels';

registerRule({ id: 'procurement.query', domain: 'procurement', actionPattern: /^(get|list|search|query|check)/, level: DecisionLevel.D0 });
registerRule({ id: 'procurement.create_pr', domain: 'procurement', actionPattern: 'create_purchase_requisition', level: DecisionLevel.D2, roles: ['admin', 'manager', 'procurement_manager'] });
registerRule({ id: 'procurement.create_po', domain: 'procurement', actionPattern: 'create_purchase_order', level: DecisionLevel.D2, roles: ['admin', 'procurement_manager'] });
registerRule({ id: 'procurement.approve_po', domain: 'procurement', actionPattern: 'approve_purchase_order', level: DecisionLevel.D3, roles: ['admin', 'manager', 'procurement_manager'] });
registerRule({ id: 'procurement.create_receipt', domain: 'procurement', actionPattern: 'create_purchase_receipt', level: DecisionLevel.D2, roles: ['admin', 'procurement_manager'] });
registerRule({ id: 'procurement.create_invoice', domain: 'procurement', actionPattern: 'create_supplier_invoice', level: DecisionLevel.D2, roles: ['admin', 'procurement_manager', 'finance_manager'] });
registerRule({ id: 'procurement.create_payment', domain: 'procurement', actionPattern: 'create_payment_request', level: DecisionLevel.D3, roles: ['admin', 'finance_manager'] });
registerRule({ id: 'procurement.cancel_po', domain: 'procurement', actionPattern: /cancel_purchase/, level: DecisionLevel.D3, roles: ['admin', 'procurement_manager'] });

// src/policy/rules/sales-rules.ts
// Policy rules for the sales domain

import { registerRule } from '../policy-engine';
import { DecisionLevel } from '../risk-levels';

registerRule({ id: 'sales.query', domain: 'sales', actionPattern: /^(get|list|search|query|check)/, level: DecisionLevel.D0 });
registerRule({ id: 'sales.create_order', domain: 'sales', actionPattern: 'create_sales_order', level: DecisionLevel.D2, roles: ['admin', 'manager', 'sales_manager'] });
registerRule({ id: 'sales.submit_order', domain: 'sales', actionPattern: 'submit_sales_order', level: DecisionLevel.D2, roles: ['admin', 'manager', 'sales_manager'] });
registerRule({ id: 'sales.approve_order', domain: 'sales', actionPattern: 'approve_sales_order', level: DecisionLevel.D3, roles: ['admin', 'manager', 'sales_manager'] });
registerRule({ id: 'sales.update_order', domain: 'sales', actionPattern: 'update_sales_order', level: DecisionLevel.D2, roles: ['admin', 'sales_manager'] });
registerRule({ id: 'sales.create_shipment', domain: 'sales', actionPattern: 'create_sales_shipment', level: DecisionLevel.D2, roles: ['admin', 'sales_manager', 'inventory_manager'] });
registerRule({ id: 'sales.confirm_shipment', domain: 'sales', actionPattern: 'confirm_sales_shipment', level: DecisionLevel.D2, roles: ['admin', 'sales_manager', 'inventory_manager'] });
registerRule({ id: 'sales.create_invoice', domain: 'sales', actionPattern: 'create_sales_invoice', level: DecisionLevel.D2, roles: ['admin', 'sales_manager', 'finance_manager'] });
registerRule({ id: 'sales.create_receipt', domain: 'sales', actionPattern: 'create_customer_receipt', level: DecisionLevel.D2, roles: ['admin', 'finance_manager'] });
registerRule({ id: 'sales.create_return', domain: 'sales', actionPattern: 'create_sales_return', level: DecisionLevel.D3, roles: ['admin', 'sales_manager'] });
registerRule({ id: 'sales.receive_return', domain: 'sales', actionPattern: 'receive_sales_return', level: DecisionLevel.D2, roles: ['admin', 'sales_manager', 'inventory_manager'] });
registerRule({ id: 'sales.cancel_order', domain: 'sales', actionPattern: /cancel_sales/, level: DecisionLevel.D3, roles: ['admin', 'sales_manager'] });

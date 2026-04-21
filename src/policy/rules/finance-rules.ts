// src/policy/rules/finance-rules.ts
// Policy rules for the finance domain

import { registerRule } from '../policy-engine';
import { DecisionLevel } from '../risk-levels';

registerRule({ id: 'finance.query', domain: 'finance', actionPattern: /^(get|list|search|query|check)/, level: DecisionLevel.D0 });
registerRule({ id: 'finance.create_voucher', domain: 'finance', actionPattern: 'create_voucher', level: DecisionLevel.D3, roles: ['admin', 'finance_manager'] });
registerRule({ id: 'finance.post_voucher', domain: 'finance', actionPattern: 'post_voucher', level: DecisionLevel.D3, roles: ['admin', 'finance_manager'] });
registerRule({ id: 'finance.void_voucher', domain: 'finance', actionPattern: 'void_voucher', level: DecisionLevel.D3, roles: ['admin', 'finance_manager'] });
registerRule({ id: 'finance.create_budget', domain: 'finance', actionPattern: 'create_budget', level: DecisionLevel.D3, roles: ['admin', 'finance_manager'] });
registerRule({ id: 'finance.approve_payment', domain: 'finance', actionPattern: 'approve_payment_request', level: DecisionLevel.D3, roles: ['admin', 'finance_manager'] });
registerRule({ id: 'finance.submit_payment', domain: 'finance', actionPattern: 'submit_payment_request', level: DecisionLevel.D2, roles: ['admin', 'finance_manager', 'manager'] });
registerRule({ id: 'finance.reject_payment', domain: 'finance', actionPattern: 'reject_payment_request', level: DecisionLevel.D3, roles: ['admin', 'finance_manager'] });
registerRule({ id: 'finance.record_payment', domain: 'finance', actionPattern: 'record_payment', level: DecisionLevel.D3, roles: ['admin', 'finance_manager'] });

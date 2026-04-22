// Phase 11: Admin — Approval rules/steps, roles, permissions, user roles, import templates
import type { TestContext } from '../../seed-api-test';

const P = 'phase11';

export async function runPhase11(ctx: TestContext, org: string): Promise<void> {
  const { api } = ctx;
  const isOrg2 = org === 'org2';
  const meta = (e: string, i: number) => ({ phase: P, entity: e, index: i });

  // --- Approval Rules ---
  const rules = [
    { rule_name: isOrg2 ? 'PO审批规则-T' : 'PO审批规则-API', document_type: 'purchase_order', min_amount: 0, max_amount: 100000, is_active: true },
    { rule_name: isOrg2 ? 'PR审批规则-T' : 'PR审批规则-API', document_type: 'payment_request', min_amount: 0, max_amount: 50000, is_active: true },
    { rule_name: isOrg2 ? '预算审批规则-T' : '预算审批规则-API', document_type: 'budget', min_amount: 100000, max_amount: 9999999, is_active: true },
  ];

  const ruleIds: string[] = [];
  for (let i = 0; i < rules.length; i++) {
    const r = await api.safePost<any>('/api/admin/approval-rules', rules[i], meta('rule-create', i));
    if (r?.data?.id) {
      ruleIds.push(r.data.id);
      console.log(`    POST Approval Rule → ${r.data.id}`);
    }
  }

  // Approval Rule Steps
  for (let i = 0; i < ruleIds.length; i++) {
    const steps = [
      { rule_id: ruleIds[i], step_order: 1, approver_role: 'manager', approval_type: 'sequential' },
      { rule_id: ruleIds[i], step_order: 2, approver_role: 'admin', approval_type: 'any_one' },
    ];
    for (let j = 0; j < steps.length; j++) {
      await api.safePost('/api/admin/approval-rule-steps', steps[j], meta('rule-step', i * 10 + j));
    }
  }

  await api.safeGet('/api/admin/approval-rules', { _limit: 10 }, meta('rules-list', 0));
  await api.safeGet('/api/admin/approval-rule-steps', { _limit: 10 }, meta('rule-steps-list', 0));
  if (ruleIds[0]) {
    await api.safeGet(`/api/admin/approval-rules/${ruleIds[0]}`, undefined, meta('rule-get', 0));
    await api.safePut(`/api/admin/approval-rules/${ruleIds[0]}`, { is_active: false }, meta('rule-update', 0));
  }

  // --- Admin Approval Records ---
  await api.safeGet('/api/admin/approval-records', { _limit: 5 }, meta('admin-approval-list', 0));

  // --- Roles ---
  const roleNames = [
    isOrg2 ? '采购经理-T' : '采购经理-API',
    isOrg2 ? '质检主管-T' : '质检主管-API',
  ];
  const roleIds: string[] = [];
  for (let i = 0; i < roleNames.length; i++) {
    const r = await api.safePost<any>('/api/admin/roles', {
      name: roleNames[i],
      description: `API seed role #${i + 1}`,
    }, meta('role-create', i));
    if (r?.data?.id) {
      roleIds.push(r.data.id);
      console.log(`    POST Role → ${r.data.id}`);
    }
  }
  await api.safeGet('/api/admin/roles', { _limit: 10 }, meta('roles-list', 0));
  if (roleIds[0]) {
    await api.safeGet(`/api/admin/roles/${roleIds[0]}`, undefined, meta('role-get', 0));
    await api.safePut(`/api/admin/roles/${roleIds[0]}`, { description: 'Updated by API test' }, meta('role-update', 0));
  }

  // --- Role Permissions ---
  for (const roleId of roleIds) {
    const perms = [
      { role_id: roleId, resource: 'purchase-orders', action: 'read' },
      { role_id: roleId, resource: 'purchase-orders', action: 'create' },
      { role_id: roleId, resource: 'purchase-orders', action: 'update' },
      { role_id: roleId, resource: 'products', action: 'read' },
    ];
    for (let i = 0; i < perms.length; i++) {
      await api.safePost('/api/admin/role-permissions', perms[i], meta('perm', i));
    }
  }
  await api.safeGet('/api/admin/role-permissions', { _limit: 10 }, meta('perms-list', 0));

  // --- User Roles ---
  const emps = await api.safeGet<any>('/api/employees', { _limit: 3 }, meta('emp-lookup', 0));
  const empIds = (emps?.data ?? []).map((e: any) => e.id);
  if (roleIds.length > 0 && empIds.length > 0) {
    for (let i = 0; i < Math.min(2, empIds.length); i++) {
      await api.safePost('/api/admin/user-roles', {
        user_id: empIds[i],
        role_id: roleIds[i % roleIds.length],
      }, meta('user-role', i));
    }
  }
  await api.safeGet('/api/admin/user-roles', { _limit: 10 }, meta('user-roles-list', 0));

  // --- Import Templates ---
  await api.safeGet('/api/admin/import', undefined, meta('import-index', 0));
  await api.safeGet('/api/admin/import/templates', undefined, meta('import-templates', 0));
  await api.safeGet('/api/admin/import/templates/products', undefined, meta('import-tpl-products', 0));

  console.log(`    Phase 11 (${org}) done`);
}

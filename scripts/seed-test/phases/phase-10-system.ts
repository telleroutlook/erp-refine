// Phase 10: System — Document attachments/relations, notifications, dynamic form data, message feedback
import type { TestContext } from '../../seed-api-test';

const P = 'phase10';

export async function runPhase10(ctx: TestContext, org: string): Promise<void> {
  const { api } = ctx;
  const meta = (e: string, i: number) => ({ phase: P, entity: e, index: i });

  // Lookups for linking
  const pos = await api.safeGet<any>('/api/purchase-orders', { _limit: 3 }, meta('po-lookup', 0));
  const poIds = (pos?.data ?? []).map((p: any) => p.id);
  const sos = await api.safeGet<any>('/api/sales-orders', { _limit: 3 }, meta('so-lookup', 0));
  const soIds = (sos?.data ?? []).map((s: any) => s.id);
  const receipts = await api.safeGet<any>('/api/purchase-receipts', { _limit: 2 }, meta('receipt-lookup', 0));
  const receiptIds = (receipts?.data ?? []).map((r: any) => r.id);
  const shipments = await api.safeGet<any>('/api/sales-shipments', { _limit: 2 }, meta('ship-lookup', 0));
  const shipIds = (shipments?.data ?? []).map((s: any) => s.id);
  const supInvs = await api.safeGet<any>('/api/supplier-invoices', { _limit: 2 }, meta('supinv-lookup', 0));
  const supInvIds = (supInvs?.data ?? []).map((i: any) => i.id);
  const contracts = await api.safeGet<any>('/api/contracts', { _limit: 2 }, meta('contract-lookup', 0));
  const contractIds = (contracts?.data ?? []).map((c: any) => c.id);

  // --- Document Attachments ---
  const attachments = [
    { entity_type: 'purchase_order', entity_id: poIds[0], file_name: 'po_attachment.pdf', file_path: '/attachments/po_1.pdf', file_size: 102400, mime_type: 'application/pdf' },
    { entity_type: 'sales_order', entity_id: soIds[0], file_name: 'so_contract.docx', file_path: '/attachments/so_1.docx', file_size: 204800, mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
    { entity_type: 'contract', entity_id: contractIds[0], file_name: 'contract_scan.jpg', file_path: '/attachments/contract_1.jpg', file_size: 512000, mime_type: 'image/jpeg' },
  ];
  for (let i = 0; i < attachments.length; i++) {
    if (!attachments[i].entity_id) continue;
    await api.safePost('/api/document-attachments', attachments[i], meta('attachment', i));
  }
  await api.safeGet('/api/document-attachments', { _limit: 10 }, meta('attach-list', 0));

  // --- Document Relations ---
  const relations = [
    { from_object_type: 'purchase_order', from_object_id: poIds[0], to_object_type: 'purchase_receipt', to_object_id: receiptIds[0], relation_type: 'fulfillment' },
    { from_object_type: 'purchase_receipt', from_object_id: receiptIds[0], to_object_type: 'supplier_invoice', to_object_id: supInvIds[0], relation_type: 'invoice' },
    { from_object_type: 'sales_order', from_object_id: soIds[0], to_object_type: 'sales_shipment', to_object_id: shipIds[0], relation_type: 'fulfillment' },
    { from_object_type: 'purchase_order', from_object_id: poIds[0], to_object_type: 'contract', to_object_id: contractIds[0], relation_type: 'reference' },
  ];
  for (let i = 0; i < relations.length; i++) {
    if (!relations[i].from_object_id || !relations[i].to_object_id) continue;
    await api.safePost('/api/document-relations', relations[i], meta('relation', i));
  }
  await api.safeGet('/api/document-relations', { _limit: 10 }, meta('relation-list', 0));

  // --- Notifications ---
  const notifs = await api.safeGet<any>('/api/notifications', { _limit: 10 }, meta('notif-list', 0));
  if (notifs?.data?.[0]) {
    await api.safeGet(`/api/notifications/${notifs.data[0].id}`, undefined, meta('notif-get', 0));
    // Mark as read
    await api.safePost(`/api/notifications/${notifs.data[0].id}/read`, {}, meta('notif-read', 0));
  }
  // Mark all as read
  await api.safePost('/api/notifications/read-all', {}, meta('notif-read-all', 0));

  // --- Workflows (read-only) ---
  const workflows = await api.safeGet<any>('/api/workflows', { _limit: 5 }, meta('workflow-list', 0));
  if (workflows?.data?.[0]) {
    await api.safeGet(`/api/workflows/${workflows.data[0].id}`, undefined, meta('workflow-get', 0));
  }

  // --- Workflow Steps ---
  const steps = await api.safeGet<any>('/api/workflow-steps', { _limit: 5 }, meta('wf-step-list', 0));
  if (steps?.data?.[0]) {
    await api.safeGet(`/api/workflow-steps/${steps.data[0].id}`, undefined, meta('wf-step-get', 0));
  }

  // --- Dynamic Form Data ---
  // Columns: schema_registry_id, data, is_sandbox, created_by
  const schemas = await api.safeGet<any>('/api/schema', { _limit: 1 }, meta('schema-lookup', 0));
  const schemaId = schemas?.data?.[0]?.id;
  if (schemaId) {
    const formData = await api.safePost<any>('/api/dynamic-form-data', {
      schema_registry_id: schemaId,
      data: { title: 'API Test Report', fields: { metric1: 42, metric2: 'good' } },
      is_sandbox: true,
    }, meta('form-data', 0));
    if (formData?.data?.id) {
      console.log(`    POST Dynamic Form → ${formData.data.id}`);
    }
  }
  await api.safeGet('/api/dynamic-form-data', { _limit: 5 }, meta('form-data-list', 0));

  // --- Message Feedback ---
  // Columns: message_id (integer), feedback, comment, session_id
  await api.safePost('/api/message-feedback', {
    message_id: 1,
    feedback: 'good',
    comment: 'API seed test feedback',
    session_id: `test-session-${Date.now()}`,
  }, meta('feedback', 0));
  await api.safeGet('/api/message-feedback', { _limit: 5 }, meta('feedback-list', 0));

  // --- Approval Records (read-only) ---
  await api.safeGet('/api/approval-records', { _limit: 5 }, meta('approval-records', 0));

  console.log(`    Phase 10 (${org}) done`);
}

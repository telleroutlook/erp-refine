-- Migration 037: Widen entity_type CHECK constraints + fix business_events column references
-- business_events serves as central audit/event sourcing, needs all resource types

ALTER TABLE business_events DROP CONSTRAINT IF EXISTS chk_entity_type;
ALTER TABLE business_events ADD CONSTRAINT chk_entity_type
  CHECK (entity_type = ANY (ARRAY[
    'purchase_order', 'sales_order', 'supplier_invoice', 'sales_invoice',
    'work_order', 'inventory', 'payment_request', 'system',
    'product', 'customer', 'supplier', 'warehouse', 'employee',
    'contract', 'fixed_asset', 'quality_inspection', 'budget',
    'purchase_receipt', 'sales_shipment', 'sales_return',
    'purchase_requisition', 'rfq', 'voucher', 'payment_record',
    'customer_receipt', 'bom', 'approval'
  ]));

ALTER TABLE document_attachments DROP CONSTRAINT IF EXISTS chk_entity_type;
ALTER TABLE document_attachments ADD CONSTRAINT chk_entity_type
  CHECK (entity_type = ANY (ARRAY[
    'purchase_order', 'sales_order', 'supplier_invoice', 'sales_invoice',
    'work_order', 'inventory', 'payment_request', 'system',
    'product', 'customer', 'supplier', 'contract', 'fixed_asset',
    'quality_inspection', 'purchase_receipt', 'sales_shipment'
  ]));

ALTER TABLE workflows DROP CONSTRAINT IF EXISTS chk_entity_type;
ALTER TABLE workflows ADD CONSTRAINT chk_entity_type
  CHECK (entity_type = ANY (ARRAY[
    'purchase_order', 'sales_order', 'supplier_invoice', 'sales_invoice',
    'work_order', 'inventory', 'payment_request', 'system',
    'contract', 'fixed_asset', 'quality_inspection', 'budget',
    'purchase_receipt'
  ]));

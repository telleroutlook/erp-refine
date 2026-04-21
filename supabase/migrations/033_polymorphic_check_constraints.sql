-- Migration 033: CHECK constraints for remaining polymorphic reference columns

ALTER TABLE inventory_reservations
  ADD CONSTRAINT chk_inv_res_reference_type
  CHECK (reference_type IN (
    'sales_order', 'work_order', 'transfer_order', 'purchase_order'
  ));

ALTER TABLE stock_transactions DROP CONSTRAINT IF EXISTS stock_transactions_reference_type_check;
ALTER TABLE stock_transactions
  ADD CONSTRAINT stock_transactions_reference_type_check
  CHECK (reference_type IN (
    'purchase', 'sales', 'production', 'adjustment', 'transfer', 'return',
    'purchase_receipt', 'sales_shipment', 'sales_return', 'work_order',
    'inventory_count', 'initial'
  ));

ALTER TABLE quality_inspections DROP CONSTRAINT IF EXISTS quality_inspections_reference_type_check;
ALTER TABLE quality_inspections
  ADD CONSTRAINT quality_inspections_reference_type_check
  CHECK (reference_type IN (
    'purchase_receipt', 'work_order', 'sales_return', 'in_process', 'final'
  ));

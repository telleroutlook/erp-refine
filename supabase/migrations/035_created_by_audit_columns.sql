-- Migration 035: Add created_by audit column to business tables that lack it

ALTER TABLE approval_records ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES employees(id);
ALTER TABLE quality_inspections ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES employees(id);
ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES employees(id);
ALTER TABLE rfq_headers ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES employees(id);
ALTER TABLE supplier_invoices ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES employees(id);

-- Add deleted_at column to business tables that were missing soft-delete support
ALTER TABLE vouchers ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE bom_headers ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE work_orders ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE document_attachments ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

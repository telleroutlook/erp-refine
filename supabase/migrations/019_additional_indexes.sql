-- 019_additional_indexes.sql
-- Performance indexes for hot query paths identified during code review

-- Notifications: queried by org + recipient on every page load
CREATE INDEX IF NOT EXISTS idx_notifications_org_recipient
  ON notifications(organization_id, recipient_id);

-- Employees: org + user_id lookup on every authenticated request
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_org_user
  ON employees(organization_id, user_id);

-- Voucher entries: loaded via join on every voucher detail view
CREATE INDEX IF NOT EXISTS idx_voucher_entries_voucher
  ON voucher_entries(voucher_id);

-- Budget lines: loaded via join on every budget detail view
CREATE INDEX IF NOT EXISTS idx_budget_lines_budget
  ON budget_lines(budget_id);

-- Purchase receipt items: joined in three-way match reconciliation
CREATE INDEX IF NOT EXISTS idx_receipt_items_po_item
  ON purchase_receipt_items(purchase_order_item_id);

-- Supplier invoice items: no purchase_order_item_id column exists in production
-- (skipped: idx_supplier_invoice_items_po_item)

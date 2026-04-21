-- Add workflow state columns for document approval/rejection flows
-- Supports submit → approve/reject lifecycle on POs, PRs, Payment Requests, Vouchers, Contracts

-- Purchase Orders: add submit/reject workflow columns
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS submitted_by UUID;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS rejected_by UUID;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Purchase Requisitions: add submit/approve/reject workflow columns
ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS submitted_by UUID;
ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS rejected_by UUID;
ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Vouchers: add void workflow columns
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS voided_by UUID;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS void_reason TEXT;

-- Payment Requests: add submit/approve/reject workflow columns
ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS submitted_by UUID;
ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS rejected_by UUID;
ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Contracts: add activate/terminate/renew workflow columns
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS activated_by UUID;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS terminated_at TIMESTAMPTZ;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS terminated_by UUID;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS termination_reason TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS renewed_from_id UUID REFERENCES contracts(id);

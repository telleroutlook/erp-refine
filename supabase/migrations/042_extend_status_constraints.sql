-- Extend status check constraints to support new workflow states

-- Vouchers: add 'voided' status
ALTER TABLE vouchers DROP CONSTRAINT vouchers_status_check;
ALTER TABLE vouchers ADD CONSTRAINT vouchers_status_check CHECK (status = ANY (ARRAY['draft','approved','posted','voided','cancelled']));

-- Vouchers: add 'general' type
ALTER TABLE vouchers DROP CONSTRAINT vouchers_voucher_type_check;
ALTER TABLE vouchers ADD CONSTRAINT vouchers_voucher_type_check CHECK (voucher_type = ANY (ARRAY['receipt','payment','transfer','general']));

-- Purchase Orders: add 'rejected' status
ALTER TABLE purchase_orders DROP CONSTRAINT purchase_orders_status_check;
ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_status_check CHECK (status = ANY (ARRAY['draft','submitted','approved','rejected','in_transit','partially_received','received','closed','cancelled']));

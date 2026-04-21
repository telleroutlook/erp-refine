-- Extend sales_orders status to include workflow states
ALTER TABLE public.sales_orders DROP CONSTRAINT IF EXISTS sales_orders_status_check;
ALTER TABLE public.sales_orders ADD CONSTRAINT sales_orders_status_check
  CHECK (status IN ('draft','submitted','confirmed','approved','rejected','shipping','shipped','completed','cancelled'));

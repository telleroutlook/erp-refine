-- Fix SECURITY DEFINER functions missing SET search_path
-- Fix notifications RLS policy that widens access beyond intended scope

-- 1. adjust_stock: add SET search_path = public
CREATE OR REPLACE FUNCTION public.adjust_stock(
  p_organization_id UUID,
  p_product_id UUID,
  p_warehouse_id UUID,
  p_delta NUMERIC
)
RETURNS stock_records
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record stock_records;
BEGIN
  INSERT INTO stock_records (organization_id, product_id, warehouse_id, quantity_on_hand)
  VALUES (p_organization_id, p_product_id, p_warehouse_id, GREATEST(p_delta, 0))
  ON CONFLICT (organization_id, product_id, warehouse_id)
  DO UPDATE SET
    quantity_on_hand = GREATEST(stock_records.quantity_on_hand + p_delta, 0),
    updated_at = now()
  RETURNING * INTO v_record;
  RETURN v_record;
END;
$$;

-- 2. fn_stock_tx_sync_records: add SET search_path = public
CREATE OR REPLACE FUNCTION public.fn_stock_tx_sync_records()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_delta NUMERIC;
BEGIN
  v_delta := CASE
    WHEN NEW.transaction_type IN ('in') THEN NEW.quantity
    WHEN NEW.transaction_type IN ('out', 'scrap') THEN -NEW.quantity
    WHEN NEW.transaction_type = 'adjust' THEN NEW.quantity
    ELSE 0
  END;

  IF v_delta != 0 THEN
    PERFORM adjust_stock(NEW.organization_id, NEW.product_id, NEW.warehouse_id, v_delta);
  END IF;
  RETURN NEW;
END;
$$;

-- 3. get_next_sequence: add SET search_path = public
CREATE OR REPLACE FUNCTION public.get_next_sequence(
  p_org_id UUID,
  p_prefix TEXT,
  p_entity_type TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seq_id UUID;
  v_current BIGINT;
  v_next BIGINT;
  v_pad INT;
  v_result TEXT;
BEGIN
  SELECT id, current_value, padding INTO v_seq_id, v_current, v_pad
  FROM number_sequences
  WHERE organization_id = p_org_id
    AND prefix = p_prefix
    AND (entity_type = p_entity_type OR (entity_type IS NULL AND p_entity_type IS NULL))
  FOR UPDATE;

  IF v_seq_id IS NULL THEN
    INSERT INTO number_sequences (organization_id, prefix, entity_type, current_value, padding)
    VALUES (p_org_id, p_prefix, p_entity_type, 1, 5)
    RETURNING id, current_value, padding INTO v_seq_id, v_current, v_pad;
    v_next := v_current;
  ELSE
    v_next := v_current + 1;
    UPDATE number_sequences SET current_value = v_next, updated_at = now() WHERE id = v_seq_id;
  END IF;

  v_result := p_prefix || lpad(v_next::TEXT, v_pad, '0');
  RETURN v_result;
END;
$$;

-- 4. Fix notifications RLS: drop the overly-permissive policy from 071
-- and ensure recipient-level isolation is maintained
DROP POLICY IF EXISTS "own_notifications" ON notifications;
CREATE POLICY "own_notifications" ON notifications
  FOR SELECT TO authenticated
  USING (
    organization_id = (SELECT organization_id FROM employees WHERE user_id = auth.uid() LIMIT 1)
    AND recipient_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

-- 5. Fix transfer_stock to use 'transfer' (matches CHECK constraint)
-- Already fixed in the migration file itself (076), but ensure the live function is correct
CREATE OR REPLACE FUNCTION public.transfer_stock(
  p_organization_id UUID,
  p_product_id UUID,
  p_from_warehouse_id UUID,
  p_to_warehouse_id UUID,
  p_quantity INTEGER,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_out_id UUID;
  v_in_id UUID;
BEGIN
  INSERT INTO stock_transactions (organization_id, product_id, warehouse_id, transaction_type, quantity, reference_type, notes)
  VALUES (p_organization_id, p_product_id, p_from_warehouse_id, 'out', p_quantity, 'transfer', p_notes)
  RETURNING id INTO v_out_id;

  INSERT INTO stock_transactions (organization_id, product_id, warehouse_id, transaction_type, quantity, reference_type, notes)
  VALUES (p_organization_id, p_product_id, p_to_warehouse_id, 'in', p_quantity, 'transfer', p_notes)
  RETURNING id INTO v_in_id;

  RETURN jsonb_build_object('out_id', v_out_id, 'in_id', v_in_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.transfer_stock(UUID, UUID, UUID, UUID, INTEGER, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transfer_stock(UUID, UUID, UUID, UUID, INTEGER, TEXT) TO service_role;

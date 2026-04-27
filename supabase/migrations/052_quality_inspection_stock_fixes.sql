-- 052_quality_inspection_stock_fixes.sql
-- 1. Add requires_inspection flag to products
-- 2. Fix adjust_stock RPC (stale column names from migration 015)
-- 3. Add stock_transactions trigger to auto-sync stock_records
-- 4. Add quality_inspections.purchase_receipt_item_id FK
-- 5. Add increment RPCs for PO received_qty / SO shipped_qty

-- ─── 1. Products: requires_inspection ──────────────────────────────────────
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS requires_inspection BOOLEAN NOT NULL DEFAULT FALSE;

-- ─── 2. Fix adjust_stock RPC (old cols: qty_on_hand, qty_reserved → quantity, reserved_quantity) ───
CREATE OR REPLACE FUNCTION adjust_stock(
  p_org_id       UUID,
  p_warehouse_id UUID,
  p_product_id   UUID,
  p_qty_delta    NUMERIC,
  p_reserved_delta NUMERIC DEFAULT 0
) RETURNS stock_records
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_record stock_records;
BEGIN
  UPDATE stock_records
  SET
    quantity          = quantity + p_qty_delta,
    reserved_quantity = reserved_quantity + p_reserved_delta
  WHERE organization_id = p_org_id
    AND warehouse_id    = p_warehouse_id
    AND product_id      = p_product_id
  RETURNING * INTO v_record;

  IF NOT FOUND THEN
    INSERT INTO stock_records (organization_id, warehouse_id, product_id, quantity, reserved_quantity)
    VALUES (p_org_id, p_warehouse_id, p_product_id, GREATEST(p_qty_delta, 0), GREATEST(p_reserved_delta, 0))
    RETURNING * INTO v_record;
  END IF;

  IF v_record.quantity < 0 THEN
    RAISE EXCEPTION 'Insufficient stock: product=%, warehouse=%, available=%, requested=%',
      p_product_id, p_warehouse_id, v_record.quantity - p_qty_delta, ABS(p_qty_delta)
      USING ERRCODE = 'check_violation';
  END IF;

  IF v_record.reserved_quantity < 0 THEN
    RAISE EXCEPTION 'Insufficient reserved stock: product=%, warehouse=%',
      p_product_id, p_warehouse_id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN v_record;
END;
$$;

GRANT EXECUTE ON FUNCTION adjust_stock(UUID, UUID, UUID, NUMERIC, NUMERIC) TO authenticated;

-- ─── 3. Trigger: stock_transactions INSERT → auto-sync stock_records ────────
CREATE OR REPLACE FUNCTION fn_stock_tx_sync_records()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM adjust_stock(
    NEW.organization_id,
    NEW.warehouse_id,
    NEW.product_id,
    CASE
      WHEN NEW.transaction_type IN ('in') THEN NEW.quantity
      WHEN NEW.transaction_type IN ('out', 'scrap') THEN -NEW.quantity
      ELSE 0
    END,
    0
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_stock_transaction_update ON stock_transactions;
CREATE TRIGGER tr_stock_transaction_update
  AFTER INSERT ON stock_transactions
  FOR EACH ROW EXECUTE FUNCTION fn_stock_tx_sync_records();

-- ─── 4. Quality inspections: link to receipt item ──────────────────────────
ALTER TABLE quality_inspections
  ADD COLUMN IF NOT EXISTS purchase_receipt_item_id UUID REFERENCES purchase_receipt_items(id);

CREATE INDEX IF NOT EXISTS idx_qi_receipt_item
  ON quality_inspections(purchase_receipt_item_id)
  WHERE purchase_receipt_item_id IS NOT NULL;

-- ─── 5. Increment RPCs for atomic counter updates ──────────────────────────
CREATE OR REPLACE FUNCTION increment_po_received_qty(p_poi_id UUID, p_qty NUMERIC)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE purchase_order_items
  SET received_quantity = COALESCE(received_quantity, 0) + p_qty
  WHERE id = p_poi_id;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_po_received_qty(UUID, NUMERIC) TO authenticated;

CREATE OR REPLACE FUNCTION increment_so_shipped_qty(p_soi_id UUID, p_qty NUMERIC)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE sales_order_items
  SET shipped_quantity = COALESCE(shipped_quantity, 0) + p_qty
  WHERE id = p_soi_id;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_so_shipped_qty(UUID, NUMERIC) TO authenticated;

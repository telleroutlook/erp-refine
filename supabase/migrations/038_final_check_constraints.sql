-- Migration 038: Final CHECK constraints for remaining polymorphic references
-- Closes the last 3 gaps from the schema improvement plan (024-037).

-- ─────────────────────────────────────────────────────────────────────
-- 1. document_relations — table exists but was never in a migration file.
--    Add CHECK constraints on from_object_type / to_object_type + RLS.
-- ─────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'chk_dr_from_object_type' AND table_name = 'document_relations'
  ) THEN
    ALTER TABLE document_relations ADD CONSTRAINT chk_dr_from_object_type
      CHECK (from_object_type IN (
        'purchase_order','sales_order','supplier_invoice','sales_invoice',
        'payment_request','payment_record','customer_receipt','contract',
        'work_order','purchase_receipt','sales_shipment','sales_return',
        'quality_inspection','voucher','budget','fixed_asset'
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'chk_dr_to_object_type' AND table_name = 'document_relations'
  ) THEN
    ALTER TABLE document_relations ADD CONSTRAINT chk_dr_to_object_type
      CHECK (to_object_type IN (
        'purchase_order','sales_order','supplier_invoice','sales_invoice',
        'payment_request','payment_record','customer_receipt','contract',
        'work_order','purchase_receipt','sales_shipment','sales_return',
        'quality_inspection','voucher','budget','fixed_asset'
      ));
  END IF;
END $$;

ALTER TABLE document_relations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'document_relations' AND policyname = 'org_isolation'
  ) THEN
    CREATE POLICY "org_isolation" ON document_relations FOR ALL
      USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- 2. notifications.entity_type — polymorphic reference, no CHECK yet.
-- ─────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'chk_notif_entity_type' AND table_name = 'notifications'
  ) THEN
    ALTER TABLE notifications ADD CONSTRAINT chk_notif_entity_type
      CHECK (entity_type IS NULL OR entity_type IN (
        'purchase_order','sales_order','supplier_invoice','sales_invoice',
        'payment_request','payment_record','customer_receipt','contract',
        'work_order','purchase_receipt','sales_shipment','sales_return',
        'quality_inspection','approval','budget','fixed_asset','system',
        'product','customer','supplier','warehouse','employee'
      ));
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- 3. product_cost_history.reference_type — polymorphic, no CHECK yet.
-- ─────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'chk_pch_reference_type' AND table_name = 'product_cost_history'
  ) THEN
    ALTER TABLE product_cost_history ADD CONSTRAINT chk_pch_reference_type
      CHECK (reference_type IS NULL OR reference_type IN (
        'purchase_receipt','sales_shipment','work_order','adjustment',
        'inventory_count','initial','return','sales_return','transfer'
      ));
  END IF;
END $$;

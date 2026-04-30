-- 056: Backfill document_relations for payment_record → voucher links
-- payment_records.voucher_id FK exists but no document_relations rows were created.
-- Also adds traversal indexes to support the chain BFS endpoint.

INSERT INTO document_relations (
  id,
  organization_id,
  from_object_type,
  from_object_id,
  to_object_type,
  to_object_id,
  relation_type,
  label,
  metadata
)
SELECT
  gen_random_uuid()::text,
  pr.organization_id,
  'payment_record',
  pr.id::text,
  'voucher',
  pr.voucher_id::text,
  'derived_from',
  'payment_record → voucher',
  '{}'::jsonb
FROM payment_records pr
WHERE pr.voucher_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM document_relations dr
    WHERE dr.organization_id = pr.organization_id
      AND dr.from_object_type = 'payment_record'
      AND dr.from_object_id = pr.id::text
      AND dr.to_object_type = 'voucher'
      AND dr.to_object_id = pr.voucher_id::text
  );

-- Indexes to support efficient BFS chain traversal
CREATE INDEX IF NOT EXISTS idx_document_relations_from_lookup
  ON document_relations(organization_id, from_object_type, from_object_id);

CREATE INDEX IF NOT EXISTS idx_document_relations_to_lookup
  ON document_relations(organization_id, to_object_type, to_object_id);

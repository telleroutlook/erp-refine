-- Migration 034: Supplier address normalization
-- Mirrors customer normalization from migration 029

INSERT INTO supplier_sites (id, supplier_id, organization_id, site_code, site_name, country, is_active, created_at, updated_at)
SELECT
  gen_random_uuid(),
  s.id,
  s.organization_id,
  'MAIN',
  s.name || ' - Main Site',
  COALESCE(s.country, 'CN'),
  true,
  now(), now()
FROM suppliers s
WHERE s.deleted_at IS NULL
ON CONFLICT DO NOTHING;

ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS default_site_id UUID REFERENCES supplier_sites(id);

UPDATE suppliers s SET default_site_id = ss.id
FROM supplier_sites ss
WHERE ss.supplier_id = s.id AND ss.site_code = 'MAIN' AND s.default_site_id IS NULL;

ALTER TABLE suppliers DROP COLUMN IF EXISTS address;
ALTER TABLE suppliers DROP COLUMN IF EXISTS country;

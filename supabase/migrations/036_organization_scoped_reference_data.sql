-- Migration 036: Organization-scoped reference data (currencies + UOMs)

CREATE TABLE IF NOT EXISTS organization_currencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  currency_code TEXT NOT NULL REFERENCES currencies(currency_code),
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, currency_code)
);

CREATE TABLE IF NOT EXISTS organization_uoms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  uom_id UUID NOT NULL REFERENCES uoms(id),
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, uom_id)
);

ALTER TABLE organization_currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_uoms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_currencies_read" ON organization_currencies
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id());

CREATE POLICY "org_currencies_write" ON organization_currencies
  FOR ALL TO authenticated
  USING (organization_id = get_user_org_id() AND get_user_role() = 'admin');

CREATE POLICY "org_uoms_read" ON organization_uoms
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id());

CREATE POLICY "org_uoms_write" ON organization_uoms
  FOR ALL TO authenticated
  USING (organization_id = get_user_org_id() AND get_user_role() = 'admin');

INSERT INTO organization_currencies (organization_id, currency_code, is_default)
SELECT o.id, c.currency_code, (c.currency_code = 'CNY')
FROM organizations o CROSS JOIN currencies c
ON CONFLICT DO NOTHING;

INSERT INTO organization_uoms (organization_id, uom_id, is_default)
SELECT o.id, u.id, false
FROM organizations o CROSS JOIN uoms u
ON CONFLICT DO NOTHING;

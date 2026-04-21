-- 027: Multi-tenant isolation + created_by audit columns

-- 1. supplier_contacts: add organization_id, backfill from supplier
ALTER TABLE supplier_contacts ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
UPDATE supplier_contacts SET organization_id = s.organization_id
FROM suppliers s WHERE s.id = supplier_contacts.supplier_id AND supplier_contacts.organization_id IS NULL;
ALTER TABLE supplier_contacts ALTER COLUMN organization_id SET NOT NULL;

-- 2. supplier_certificates: add organization_id, backfill from supplier
ALTER TABLE supplier_certificates ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
UPDATE supplier_certificates SET organization_id = s.organization_id
FROM suppliers s WHERE s.id = supplier_certificates.supplier_id AND supplier_certificates.organization_id IS NULL;
ALTER TABLE supplier_certificates ALTER COLUMN organization_id SET NOT NULL;

-- 3. profile_change_requests: add organization_id, backfill from supplier
ALTER TABLE profile_change_requests ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
UPDATE profile_change_requests SET organization_id = s.organization_id
FROM suppliers s WHERE s.id = profile_change_requests.supplier_id AND profile_change_requests.organization_id IS NULL;

-- 4. tool_registry: add organization_id nullable (NULL = global)
ALTER TABLE tool_registry ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- 5. Add created_by audit columns to master data tables
ALTER TABLE products ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE fixed_assets ADD COLUMN IF NOT EXISTS created_by UUID;

-- 6. Enable RLS on tables that were missing it
ALTER TABLE supplier_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_change_requests ENABLE ROW LEVEL SECURITY;

-- 7. RLS policies for newly org-scoped tables
CREATE POLICY supplier_contacts_org_isolation ON supplier_contacts
  USING (organization_id = (current_setting('app.current_organization_id', true))::uuid);

CREATE POLICY supplier_certificates_org_isolation ON supplier_certificates
  USING (organization_id = (current_setting('app.current_organization_id', true))::uuid);

CREATE POLICY profile_change_requests_org_isolation ON profile_change_requests
  USING (organization_id = (current_setting('app.current_organization_id', true))::uuid
    OR organization_id IS NULL);

-- 8. Indexes for new org_id columns
CREATE INDEX IF NOT EXISTS idx_supplier_contacts_org ON supplier_contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_supplier_certificates_org ON supplier_certificates(organization_id);
CREATE INDEX IF NOT EXISTS idx_profile_change_requests_org ON profile_change_requests(organization_id);

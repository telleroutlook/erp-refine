-- Add organization_id to supplier_quotations for direct org isolation
-- Previously relied on rfq_id FK → rfq_headers.organization_id, but all API
-- routes expect a direct organization_id column (consistent with every other table).

ALTER TABLE supplier_quotations
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Backfill from rfq_headers
UPDATE supplier_quotations sq
SET organization_id = rh.organization_id
FROM rfq_headers rh
WHERE sq.rfq_id = rh.id
  AND sq.organization_id IS NULL;

-- Make NOT NULL after backfill
ALTER TABLE supplier_quotations
  ALTER COLUMN organization_id SET NOT NULL;

-- Index for org-scoped queries
CREATE INDEX IF NOT EXISTS idx_supplier_quotations_org
  ON supplier_quotations(organization_id);

-- Drop old RLS policy and create direct org-scoped policy
DROP POLICY IF EXISTS "org_access_via_rfq" ON supplier_quotations;

CREATE POLICY "org_isolation" ON supplier_quotations FOR ALL
  USING (organization_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'organization_id')::uuid);

-- Migration 032: RLS enforcement + auth_events organization_id
-- Fixes: 5 tables with RLS disabled despite having policies,
--         auth_events missing organization_id,
--         auth_events and tool_registry missing RLS policies

ALTER TABLE auth_events
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

CREATE INDEX IF NOT EXISTS idx_auth_events_org
  ON auth_events(organization_id);

ALTER TABLE auth_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE number_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_events_read" ON auth_events
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id());

CREATE POLICY "auth_events_insert" ON auth_events
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "tool_registry_read" ON tool_registry
  FOR SELECT TO authenticated
  USING (organization_id IS NULL OR organization_id = get_user_org_id());

CREATE POLICY "tool_registry_write" ON tool_registry
  FOR ALL TO authenticated
  USING (
    (organization_id IS NULL AND get_user_role() = 'admin')
    OR organization_id = get_user_org_id()
  );

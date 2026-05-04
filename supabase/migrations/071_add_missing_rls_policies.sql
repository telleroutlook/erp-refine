-- Fix: These tables had RLS enabled but no policies, causing all queries to return empty.

-- number_sequences: org-scoped read for all authenticated, write for admin
CREATE POLICY "org_read" ON number_sequences
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id());

CREATE POLICY "org_manage" ON number_sequences
  FOR ALL TO authenticated
  USING (organization_id = get_user_org_id() AND get_user_role() = 'admin')
  WITH CHECK (organization_id = get_user_org_id() AND get_user_role() = 'admin');

-- notifications: org-scoped access
CREATE POLICY "own_notifications" ON notifications
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id());

CREATE POLICY "system_insert" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "own_update" ON notifications
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id());

-- workflow_steps: org-scoped via parent workflow
CREATE POLICY "org_read" ON workflow_steps
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflows w
      WHERE w.id = workflow_steps.workflow_id
        AND w.organization_id = get_user_org_id()
    )
  );

CREATE POLICY "org_manage" ON workflow_steps
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflows w
      WHERE w.id = workflow_steps.workflow_id
        AND w.organization_id = get_user_org_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workflows w
      WHERE w.id = workflow_steps.workflow_id
        AND w.organization_id = get_user_org_id()
    )
  );

-- import_logs: org-scoped
CREATE POLICY "org_access" ON import_logs
  FOR ALL TO authenticated
  USING (organization_id = get_user_org_id());

-- product_cost_history: org-scoped
CREATE POLICY "org_access" ON product_cost_history
  FOR ALL TO authenticated
  USING (organization_id = get_user_org_id());

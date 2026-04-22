-- Add missing RLS policies for roles and approval_rule_steps

-- roles: standard org-scoped policy
CREATE POLICY org_access ON roles
  FOR ALL
  USING (organization_id = ((auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid));

-- approval_rule_steps: access via parent approval_rules which has organization_id
CREATE POLICY org_access ON approval_rule_steps
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM approval_rules ar
      WHERE ar.id = approval_rule_steps.rule_id
        AND ar.organization_id = ((auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid)
    )
  );

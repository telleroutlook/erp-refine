-- Fix custodian_id FK: should reference employees(id) not auth.users(id)
-- The route and seed scripts send employee IDs, not auth user IDs
UPDATE fixed_assets SET custodian_id = NULL WHERE custodian_id IS NOT NULL AND custodian_id NOT IN (SELECT id FROM employees);

ALTER TABLE fixed_assets DROP CONSTRAINT fixed_assets_custodian_id_fkey;
ALTER TABLE fixed_assets ADD CONSTRAINT fixed_assets_custodian_id_fkey FOREIGN KEY (custodian_id) REFERENCES employees(id);

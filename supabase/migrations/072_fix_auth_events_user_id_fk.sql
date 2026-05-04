-- auth_events.user_id incorrectly referenced portal_users.id
-- It should reference auth.users since auth_events tracks ALL user login events
ALTER TABLE auth_events DROP CONSTRAINT auth_events_user_id_fkey;
ALTER TABLE auth_events ADD CONSTRAINT auth_events_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

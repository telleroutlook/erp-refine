-- 057_profile_change_request_sequence.sql
-- Add profile_change_request number sequence for all organizations

INSERT INTO number_sequences (organization_id, sequence_name, prefix, current_value, increment_by, padding)
SELECT id, 'profile_change_request', 'PCR', 0, 1, 6
FROM organizations
ON CONFLICT (organization_id, sequence_name) DO NOTHING;

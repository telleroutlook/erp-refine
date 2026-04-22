-- Add missing columns to schema_registry that the SchemaRegistry code expects
ALTER TABLE schema_registry
  ADD COLUMN IF NOT EXISTS json_schema jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS ui_schema jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS version integer DEFAULT 1 NOT NULL,
  ADD COLUMN IF NOT EXISTS risk_score numeric DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS trace_id text DEFAULT NULL;

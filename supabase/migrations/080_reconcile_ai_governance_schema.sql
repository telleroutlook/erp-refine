-- 080_reconcile_ai_governance_schema.sql
-- Idempotent migration documenting the current live state of AI governance tables.
-- Migration 011 defined the initial schema; subsequent untracked ALTER statements
-- renamed columns and added fields. This migration makes the chain authoritative
-- by applying all diffs idempotently (IF NOT EXISTS / IF EXISTS guards).

-- ============================================================
-- agent_sessions: reconcile with live schema
-- ============================================================

-- Rename agent_type → agent_id (if the old column still exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='agent_sessions' AND column_name='agent_type')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='agent_sessions' AND column_name='agent_id')
  THEN
    ALTER TABLE public.agent_sessions RENAME COLUMN agent_type TO agent_id;
  END IF;
END $$;

-- Add session_type if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='agent_sessions' AND column_name='session_type') THEN
    ALTER TABLE public.agent_sessions ADD COLUMN session_type TEXT NOT NULL DEFAULT 'chat';
  END IF;
END $$;

-- Add message_count if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='agent_sessions' AND column_name='message_count') THEN
    ALTER TABLE public.agent_sessions ADD COLUMN message_count INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- ============================================================
-- agent_decisions: reconcile with live schema
-- ============================================================

-- Rename agent_type → agent_id
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='agent_decisions' AND column_name='agent_type')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='agent_decisions' AND column_name='agent_id')
  THEN
    ALTER TABLE public.agent_decisions RENAME COLUMN agent_type TO agent_id;
  END IF;
END $$;

-- Rename human_approval_required → human_approval_req
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='agent_decisions' AND column_name='human_approval_required')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='agent_decisions' AND column_name='human_approval_req')
  THEN
    ALTER TABLE public.agent_decisions RENAME COLUMN human_approval_required TO human_approval_req;
  END IF;
END $$;

-- Rename approver_id → approver
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='agent_decisions' AND column_name='approver_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='agent_decisions' AND column_name='approver')
  THEN
    ALTER TABLE public.agent_decisions RENAME COLUMN approver_id TO approver;
  END IF;
END $$;

-- Drop trace_id if it exists (removed from live schema)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='agent_decisions' AND column_name='trace_id') THEN
    ALTER TABLE public.agent_decisions DROP COLUMN trace_id;
  END IF;
END $$;

-- Add delegated_by if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='agent_decisions' AND column_name='delegated_by') THEN
    ALTER TABLE public.agent_decisions ADD COLUMN delegated_by TEXT;
  END IF;
END $$;

-- Add trigger_event_id if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='agent_decisions' AND column_name='trigger_event_id') THEN
    ALTER TABLE public.agent_decisions ADD COLUMN trigger_event_id TEXT;
  END IF;
END $$;

-- Add trigger_event_version if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='agent_decisions' AND column_name='trigger_event_version') THEN
    ALTER TABLE public.agent_decisions ADD COLUMN trigger_event_version TEXT;
  END IF;
END $$;

-- Change outcome from JSONB to TEXT (if it's still JSONB)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='agent_decisions' AND column_name='outcome' AND data_type='jsonb'
  ) THEN
    ALTER TABLE public.agent_decisions ALTER COLUMN outcome TYPE TEXT USING outcome::TEXT;
  END IF;
END $$;

-- Update CHECK constraint on agent_id to reflect current valid values
-- (original was agent_type IN ('intent','schema_architect','execution','orchestrator'))
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'agent_decisions_agent_type_check' AND conrelid = 'public.agent_decisions'::regclass
  ) THEN
    ALTER TABLE public.agent_decisions DROP CONSTRAINT agent_decisions_agent_type_check;
  END IF;
END $$;

-- ── 024: Backfill columns missing from production ─────────────────
-- Safe to re-run; all statements use IF NOT EXISTS / IF EXISTS guards.

-- profiles: verified_by fields (from migration 003)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_by_name    TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_by_company TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified         BOOLEAN NOT NULL DEFAULT false;

-- crm_invite_tokens: created_by (from migration 018)
-- Added as nullable so existing rows (if any) don't violate NOT NULL.
ALTER TABLE crm_invite_tokens ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Reload PostgREST schema cache so the new columns are immediately visible.
NOTIFY pgrst, 'reload schema';

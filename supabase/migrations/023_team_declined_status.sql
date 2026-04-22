-- ── 023: Add 'declined' to teams status constraint ────────────────

ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_status_check;
ALTER TABLE teams ADD CONSTRAINT teams_status_check
  CHECK (status IN ('pending', 'active', 'suspended', 'declined'));

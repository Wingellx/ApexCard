-- ── 021: Sub-team hierarchy + approval workflow ──────────────────

-- Add hierarchy + approval fields to teams
ALTER TABLE teams ADD COLUMN IF NOT EXISTS parent_team_id UUID REFERENCES teams(id);
ALTER TABLE teams ADD COLUMN IF NOT EXISTS status        TEXT DEFAULT 'active' CHECK (status IN ('pending','active','suspended'));
ALTER TABLE teams ADD COLUMN IF NOT EXISTS created_by    UUID REFERENCES profiles(id);
ALTER TABLE teams ADD COLUMN IF NOT EXISTS approve_token UUID UNIQUE DEFAULT gen_random_uuid();
ALTER TABLE teams ADD COLUMN IF NOT EXISTS decline_token UUID UNIQUE DEFAULT gen_random_uuid();

-- Mark all existing teams as active (they were manually created, already approved)
UPDATE teams SET status = 'active' WHERE status IS NULL;

-- Team managers: lets one person manage multiple sub-teams
-- (separate from team_members so the UNIQUE(user_id) constraint doesn't block it)
CREATE TABLE team_managers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_id    UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, team_id)
);

ALTER TABLE team_managers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "managers read their own entries"
  ON team_managers FOR SELECT
  USING (auth.uid() = user_id);

-- RLS: sub-teams inherit visibility from parent team membership
CREATE POLICY "active sub-teams readable by parent members"
  ON teams FOR SELECT
  USING (
    status = 'active'
    OR created_by = auth.uid()
    OR id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
    OR id IN (SELECT team_id FROM team_managers WHERE user_id = auth.uid())
  );

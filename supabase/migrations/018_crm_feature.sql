-- ── 018: CRM feature ────────────────────────────────────────────

-- 1. Owner → Teams oversight (owner can oversee multiple teams without being a member)
CREATE TABLE owner_teams (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_id    UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(owner_id, team_id)
);

ALTER TABLE owner_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners manage their team links"
  ON owner_teams FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "team admins read owner links for their team"
  ON owner_teams FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 2. Expiring per-member invite tokens (replaces static invite_code for CRM flow)
CREATE TABLE crm_invite_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token       TEXT UNIQUE NOT NULL,
  team_id     UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_by  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  used_by     UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE crm_invite_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "managers create tokens for their team"
  ON crm_invite_tokens FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
        AND team_id = crm_invite_tokens.team_id
        AND role = 'admin'
    )
  );

CREATE POLICY "managers view tokens they created"
  ON crm_invite_tokens FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "anyone can read token for redemption"
  ON crm_invite_tokens FOR SELECT
  USING (true);

-- 3. Daily CRM submissions by members
CREATE TABLE crm_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_id         UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  submission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  contact_name    TEXT NOT NULL,
  company         TEXT,
  contact_email   TEXT,
  contact_phone   TEXT,
  status          TEXT NOT NULL DEFAULT 'new_lead' CHECK (status IN (
                    'new_lead', 'contacted', 'follow_up',
                    'interested', 'not_interested', 'closed'
                  )),
  outcome         TEXT NOT NULL DEFAULT 'pending' CHECK (outcome IN (
                    'pending', 'won', 'lost'
                  )),
  deal_value      NUMERIC(12, 2) CHECK (deal_value >= 0),
  notes           TEXT,
  next_followup   DATE,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT crm_submissions_unique_entry UNIQUE(user_id, contact_name, submission_date)
);

CREATE INDEX crm_submissions_team_date_idx   ON crm_submissions(team_id, submission_date DESC);
CREATE INDEX crm_submissions_user_date_idx   ON crm_submissions(user_id, submission_date DESC);

ALTER TABLE crm_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members manage own submissions"
  ON crm_submissions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins and owners read all team submissions"
  ON crm_submissions FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR
    team_id IN (
      SELECT team_id FROM owner_teams WHERE owner_id = auth.uid()
    )
  );

-- 4. Track who invited each team member
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES profiles(id);

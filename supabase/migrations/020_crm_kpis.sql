-- ── 020: CRM KPI targets (one active set per team) ───────────────

CREATE TABLE crm_kpis (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id          UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_by       UUID NOT NULL REFERENCES profiles(id),
  -- Daily targets (0 = no target set for that metric)
  outbound_target  INTEGER NOT NULL DEFAULT 0 CHECK (outbound_target >= 0),
  followup_target  INTEGER NOT NULL DEFAULT 0 CHECK (followup_target >= 0),
  pitched_target   INTEGER NOT NULL DEFAULT 0 CHECK (pitched_target >= 0),
  booked_target    INTEGER NOT NULL DEFAULT 0 CHECK (booked_target >= 0),
  replied_target   INTEGER NOT NULL DEFAULT 0 CHECK (replied_target >= 0),
  hours_target     NUMERIC(4, 1) NOT NULL DEFAULT 0 CHECK (hours_target >= 0),
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT crm_kpis_team_unique UNIQUE(team_id)
);

ALTER TABLE crm_kpis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage team kpis"
  ON crm_kpis FOR ALL
  USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "members read their team kpis"
  ON crm_kpis FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

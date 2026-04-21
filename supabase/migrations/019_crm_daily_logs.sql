-- ── 019: CRM daily logs (replaces per-contact submission model) ──

CREATE TABLE crm_daily_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_id           UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  log_date          DATE NOT NULL DEFAULT CURRENT_DATE,
  outbound_messages INTEGER NOT NULL DEFAULT 0 CHECK (outbound_messages >= 0),
  followup_messages INTEGER NOT NULL DEFAULT 0 CHECK (followup_messages >= 0),
  calls_pitched     INTEGER NOT NULL DEFAULT 0 CHECK (calls_pitched >= 0),
  calls_booked      INTEGER NOT NULL DEFAULT 0 CHECK (calls_booked >= 0),
  replied           INTEGER NOT NULL DEFAULT 0 CHECK (replied >= 0),
  disqualified      INTEGER NOT NULL DEFAULT 0 CHECK (disqualified >= 0),
  hours_worked      NUMERIC(4, 1) NOT NULL DEFAULT 0 CHECK (hours_worked >= 0 AND hours_worked <= 24),
  score             NUMERIC(8, 2) GENERATED ALWAYS AS (
    (calls_booked     * 10.0) +
    (calls_pitched    *  3.0) +
    (replied          *  2.0) +
    (followup_messages * 1.5) +
    (hours_worked     *  2.0) +
    (outbound_messages * 1.0)
  ) STORED,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT crm_daily_logs_unique UNIQUE(user_id, log_date)
);

CREATE INDEX crm_daily_logs_team_date_idx ON crm_daily_logs(team_id, log_date DESC);
CREATE INDEX crm_daily_logs_user_date_idx ON crm_daily_logs(user_id, log_date DESC);

ALTER TABLE crm_daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members manage own logs"
  ON crm_daily_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins and owners read all team logs"
  ON crm_daily_logs FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR
    team_id IN (
      SELECT team_id FROM owner_teams WHERE owner_id = auth.uid()
    )
  );

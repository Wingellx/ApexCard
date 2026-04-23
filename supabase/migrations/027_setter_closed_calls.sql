-- ── 027: Setter closed calls & preferences ────────────────────

-- Setter commission preferences
CREATE TABLE setter_preferences (
  user_id                UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  default_commission_pct NUMERIC(5,2) NOT NULL DEFAULT 10.00
    CHECK (default_commission_pct >= 0 AND default_commission_pct <= 100),
  updated_at             TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE setter_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "setter manages own preferences"
  ON setter_preferences FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Setter closed calls log
CREATE TABLE setter_closed_calls (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_id           UUID NOT NULL REFERENCES teams(id)    ON DELETE CASCADE,
  lead_name         TEXT NOT NULL,
  closed_amount     NUMERIC(12,2) NOT NULL DEFAULT 0
    CHECK (closed_amount >= 0),
  commission_pct    NUMERIC(5,2)  NOT NULL DEFAULT 0
    CHECK (commission_pct >= 0 AND commission_pct <= 100),
  commission_earned NUMERIC(12,2) GENERATED ALWAYS AS (
    ROUND(closed_amount * commission_pct / 100.0, 2)
  ) STORED,
  date_closed       DATE NOT NULL DEFAULT CURRENT_DATE,
  closer_name       TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX setter_closed_calls_user_idx ON setter_closed_calls(user_id, date_closed DESC);
CREATE INDEX setter_closed_calls_team_idx ON setter_closed_calls(team_id, date_closed DESC);

ALTER TABLE setter_closed_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "setter manages own closed calls"
  ON setter_closed_calls FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "team admins read closed calls"
  ON setter_closed_calls FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

NOTIFY pgrst, 'reload schema';

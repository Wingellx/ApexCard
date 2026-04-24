-- ── 030: Closer Custom CRM Fields ────────────────────────────────

-- 1. Field definitions
CREATE TABLE crm_field_definitions (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_id      UUID         REFERENCES teams(id) ON DELETE SET NULL,
  field_name   TEXT         NOT NULL,
  field_label  TEXT         NOT NULL,
  field_type   TEXT         NOT NULL CHECK (field_type IN ('number', 'boolean', 'text', 'duration')),
  field_order  INTEGER      NOT NULL DEFAULT 0,
  is_active    BOOLEAN      NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ  DEFAULT now()
);

CREATE INDEX crm_field_definitions_user_idx ON crm_field_definitions(user_id, field_order);
CREATE INDEX crm_field_definitions_team_idx ON crm_field_definitions(team_id, field_order);

ALTER TABLE crm_field_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own fields"
  ON crm_field_definitions FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "team admins manage team fields"
  ON crm_field_definitions FOR ALL
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

CREATE POLICY "team members read team fields"
  ON crm_field_definitions FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- 2. Custom log values
CREATE TABLE crm_custom_logs (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_id         UUID         REFERENCES teams(id) ON DELETE SET NULL,
  log_date        DATE         NOT NULL DEFAULT CURRENT_DATE,
  field_id        UUID         NOT NULL REFERENCES crm_field_definitions(id) ON DELETE CASCADE,
  value_number    NUMERIC,
  value_boolean   BOOLEAN,
  value_text      TEXT,
  created_at      TIMESTAMPTZ  DEFAULT now(),
  UNIQUE (user_id, field_id, log_date)
);

CREATE INDEX crm_custom_logs_user_date_idx ON crm_custom_logs(user_id, log_date DESC);
CREATE INDEX crm_custom_logs_team_date_idx ON crm_custom_logs(team_id, log_date DESC);

ALTER TABLE crm_custom_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own logs"
  ON crm_custom_logs FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "team admins read team logs"
  ON crm_custom_logs FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "team members read team logs"
  ON crm_custom_logs FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

NOTIFY pgrst, 'reload schema';

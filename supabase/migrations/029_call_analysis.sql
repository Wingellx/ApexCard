-- ── 029: Closer Call Analysis ────────────────────────────────────

-- 1. Call records
CREATE TABLE closer_call_records (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_id          UUID         REFERENCES teams(id) ON DELETE SET NULL,
  lead_name        TEXT         NOT NULL,
  call_date        DATE         NOT NULL DEFAULT CURRENT_DATE,
  call_outcome     TEXT         NOT NULL CHECK (call_outcome IN (
    'closed', 'no_show', 'not_interested', 'follow_up', 'objection_lost'
  )),
  deal_value       NUMERIC(12,2),
  recording_url    TEXT,
  notes            TEXT,
  transcript       TEXT,
  analysis_status  TEXT         NOT NULL DEFAULT 'none' CHECK (analysis_status IN (
    'none', 'processing', 'complete', 'failed'
  )),
  analysis_result  JSONB,
  created_at       TIMESTAMPTZ  DEFAULT now(),
  updated_at       TIMESTAMPTZ  DEFAULT now()
);

CREATE INDEX closer_call_records_user_idx ON closer_call_records(user_id, call_date DESC);
CREATE INDEX closer_call_records_team_idx ON closer_call_records(team_id, call_date DESC);

ALTER TABLE closer_call_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "closers manage own records"
  ON closer_call_records FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "team admins read call records"
  ON closer_call_records FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 2. Objections extracted by AI per call
CREATE TABLE call_objections (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  call_record_id   UUID         NOT NULL REFERENCES closer_call_records(id) ON DELETE CASCADE,
  objection_type   TEXT         NOT NULL,
  objection_text   TEXT         NOT NULL,
  handled          BOOLEAN      NOT NULL DEFAULT false,
  resolution_text  TEXT,
  created_at       TIMESTAMPTZ  DEFAULT now()
);

CREATE INDEX call_objections_record_idx ON call_objections(call_record_id);

ALTER TABLE call_objections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "closers manage own objections"
  ON call_objections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM closer_call_records
      WHERE id = call_objections.call_record_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM closer_call_records
      WHERE id = call_objections.call_record_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "team admins read objections"
  ON call_objections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM closer_call_records
      WHERE id = call_objections.call_record_id
        AND team_id IN (
          SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role = 'admin'
        )
    )
  );

-- 3. Monthly improvement metrics — upserted after each analysis
CREATE TABLE closer_improvement_metrics (
  id                     UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month                  DATE         NOT NULL, -- always first of month, e.g. 2024-04-01
  calls_analysed         INTEGER      NOT NULL DEFAULT 0,
  avg_handle_rate        NUMERIC(5,2) NOT NULL DEFAULT 0,
  most_common_objection  TEXT,
  close_rate             NUMERIC(5,2) NOT NULL DEFAULT 0,
  improvement_score      NUMERIC(5,1) NOT NULL DEFAULT 0,
  top_weakness           TEXT,
  top_strength           TEXT,
  created_at             TIMESTAMPTZ  DEFAULT now(),
  updated_at             TIMESTAMPTZ  DEFAULT now(),
  UNIQUE(user_id, month)
);

ALTER TABLE closer_improvement_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "closers manage own metrics"
  ON closer_improvement_metrics FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';

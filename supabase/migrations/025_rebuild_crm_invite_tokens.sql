-- ── 025: Rebuild crm_invite_tokens with correct schema ────────────
-- The production table is missing columns. We drop and recreate it
-- cleanly (it holds only short-lived tokens so data loss is fine).

DROP TABLE IF EXISTS crm_invite_tokens CASCADE;

CREATE TABLE crm_invite_tokens (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  token       TEXT        UNIQUE NOT NULL,
  team_id     UUID        NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_by  UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  used_by     UUID        REFERENCES profiles(id),
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

NOTIFY pgrst, 'reload schema';

-- ── 026: Content CRM ──────────────────────────────────────────────

-- 1. Extend team_members role to include offer_owner
ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_role_check;
ALTER TABLE team_members ADD CONSTRAINT team_members_role_check
  CHECK (role IN ('member', 'admin', 'offer_owner'));

-- 2. Track intended role on invite tokens
ALTER TABLE crm_invite_tokens
  ADD COLUMN IF NOT EXISTS invited_role TEXT NOT NULL DEFAULT 'member'
  CHECK (invited_role IN ('member', 'offer_owner'));

-- 3. Content posts
CREATE TABLE IF NOT EXISTS content_posts (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id            UUID        NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  logged_by          UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform           TEXT        NOT NULL CHECK (platform IN (
    'instagram', 'tiktok', 'youtube', 'youtube_shorts'
  )),
  content_type       TEXT        NOT NULL CHECK (content_type IN (
    'educational', 'entertaining', 'testimonial', 'behind_the_scenes',
    'offer_promotional', 'pain_point', 'authority_credibility',
    'trend_reactive', 'case_study', 'engagement_bait'
  )),
  date_posted        DATE        NOT NULL,
  post_url           TEXT,
  views              INTEGER     NOT NULL DEFAULT 0 CHECK (views >= 0),
  performance_rating INTEGER     NOT NULL CHECK (performance_rating BETWEEN 1 AND 10),
  notes              TEXT,
  -- score: (normalised_views × 0.5) + (rating/10 × 0.5), capped at 1.0
  content_score      NUMERIC(5,4) GENERATED ALWAYS AS (
    LEAST(1.0,
      LEAST(1.0, views::NUMERIC / CASE platform
        WHEN 'instagram'      THEN 1000.0
        WHEN 'tiktok'         THEN 5000.0
        WHEN 'youtube'        THEN 2000.0
        WHEN 'youtube_shorts' THEN 3000.0
        ELSE 1000.0
      END) * 0.5
      + performance_rating::NUMERIC / 10.0 * 0.5
    )
  ) STORED,
  created_at         TIMESTAMPTZ DEFAULT now(),
  updated_at         TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS content_posts_team_date ON content_posts(team_id, date_posted DESC);
CREATE INDEX IF NOT EXISTS content_posts_logged_by ON content_posts(logged_by);

ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;

-- Any team member (including offer_owner) can log content for their team
CREATE POLICY "content insert for team members"
  ON content_posts FOR INSERT
  WITH CHECK (
    logged_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid() AND team_id = content_posts.team_id
    )
  );

-- Any team member or manager can view the team's content
CREATE POLICY "content select for team members"
  ON content_posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid() AND team_id = content_posts.team_id
    )
    OR EXISTS (
      SELECT 1 FROM team_managers
      WHERE user_id = auth.uid() AND team_id = content_posts.team_id
    )
  );

-- Own posts can be updated/deleted
CREATE POLICY "content update own posts"
  ON content_posts FOR UPDATE
  USING (logged_by = auth.uid());

CREATE POLICY "content delete own posts"
  ON content_posts FOR DELETE
  USING (logged_by = auth.uid());

NOTIFY pgrst, 'reload schema';

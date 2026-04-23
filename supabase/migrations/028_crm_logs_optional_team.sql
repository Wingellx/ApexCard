-- ── 028: Make crm_daily_logs.team_id optional ────────────────────
-- Allows solo setters (not yet on a team) to log daily activity.
-- If team_id is present the FK is still enforced; NULL means solo log.

ALTER TABLE crm_daily_logs ALTER COLUMN team_id DROP NOT NULL;

NOTIFY pgrst, 'reload schema';

-- ── 022: Expand profiles role constraint ─────────────────────────
-- Adds sales_manager and offer_owner to the allowed role values.
-- Keeps manager for backward compatibility with existing rows.

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('closer', 'setter', 'operator', 'manager', 'sales_manager', 'offer_owner'));

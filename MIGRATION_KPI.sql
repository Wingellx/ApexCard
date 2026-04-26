-- ── 1. Custom Features (owner-assigned feature flags per user) ──────────────
create table if not exists public.custom_features (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  feature     text not null,
  enabled     boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (user_id, feature)
);

alter table public.custom_features enable row level security;

-- Users can read their own features
create policy "Users read own custom features"
  on public.custom_features for select
  using (auth.uid() = user_id);

-- Only service role / owner server actions can insert or update
-- (use the service-role key / admin client from server actions)
create policy "Service role manages custom features"
  on public.custom_features for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');


-- ── 2. Closing KPI Entries ────────────────────────────────────────────────────
create table if not exists public.closing_kpi_entries (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  year           integer not null,
  month          integer not null check (month between 1 and 12),
  ad_spend       numeric(12,2) not null default 0,
  follows        integer not null default 0,
  inb_leads      integer not null default 0,
  dms            integer not null default 0,
  convos         integer not null default 0,
  calls_taken    integer not null default 0,
  calls_closed   integer not null default 0,
  cash_collected numeric(12,2) not null default 0,
  revenue        numeric(12,2) not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (user_id, year, month)
);

alter table public.closing_kpi_entries enable row level security;

create policy "Users manage own KPI entries"
  on public.closing_kpi_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists kpi_entries_updated_at on public.closing_kpi_entries;
create trigger kpi_entries_updated_at
  before update on public.closing_kpi_entries
  for each row execute function public.set_updated_at();


-- ── 3. Google Sheet Connections ──────────────────────────────────────────────
create table if not exists public.google_sheet_connections (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade unique,
  sheet_id      text not null,
  sheet_name    text not null default '',
  access_token  text not null,
  refresh_token text not null,
  token_expiry  timestamptz not null,
  created_at    timestamptz not null default now()
);

alter table public.google_sheet_connections enable row level security;

create policy "Users manage own sheet connection"
  on public.google_sheet_connections for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ── 4. Seed the closing_kpi_dashboard feature for the target user ────────────
-- Replace '<USER_ID>' with the actual Supabase user UUID once their account exists.
-- Run this after the user has signed up:
--
--   insert into public.custom_features (user_id, feature, enabled)
--   values ('<USER_ID>', 'closing_kpi_dashboard', true)
--   on conflict (user_id, feature) do update set enabled = true;

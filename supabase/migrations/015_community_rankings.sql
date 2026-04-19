-- ============================================================
-- Community rankings: division, tier, community_type, tier history
-- ============================================================

-- 1. New columns on teams
alter table public.teams
  add column if not exists division       text not null default 'sales'
    check (division in ('sales', 'improvement', 'mixed')),
  add column if not exists tier           integer not null default 2
    check (tier between 1 and 3),
  add column if not exists community_type text not null default 'mixed'
    check (community_type in ('closer', 'setter', 'operator', 'mixed'));

-- 2. Update IO team (real UUID)
update public.teams
set division = 'improvement', tier = 1, community_type = 'mixed'
where id = 'fa2d6f19-85f3-44f3-ae05-0e44aedfb64e';

-- 3. Tier history — one row per team per month, written at month-end
create table if not exists public.community_tier_history (
  id               uuid primary key default gen_random_uuid(),
  team_id          uuid not null references public.teams(id) on delete cascade,
  month            date not null,     -- first day of that month
  tier             integer not null check (tier between 1 and 3),
  score            numeric not null default 0,
  rank_in_division integer,
  created_at       timestamptz not null default now(),
  unique (team_id, month)
);

alter table public.community_tier_history enable row level security;

create policy "Anyone can read tier history"
  on public.community_tier_history for select
  using (true);

-- ============================================================
-- Teams (admin-created only — no user self-service)
-- ============================================================
create table if not exists public.teams (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  invite_code  text not null unique,
  logo_url     text,
  created_at   timestamptz not null default now()
);

alter table public.teams enable row level security;

-- Any authenticated user can read team info (needed for join page)
create policy "Authenticated users can read teams"
  on public.teams for select
  to authenticated
  using (true);

-- ============================================================
-- Team Members
-- One row per user — enforces one-team-at-a-time via unique(user_id)
-- References profiles so PostgREST can auto-join
-- ============================================================
create table if not exists public.team_members (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references public.teams(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  joined_at  timestamptz not null default now(),
  unique (user_id)
);

alter table public.team_members enable row level security;

-- Users can read their own membership row
create policy "Users can read own membership"
  on public.team_members for select
  using (auth.uid() = user_id);

-- Users can read teammates (members of teams they belong to)
create policy "Users can read teammates"
  on public.team_members for select
  using (
    team_id in (
      select team_id from public.team_members where user_id = auth.uid()
    )
  );

-- Users can join a team by inserting their own row
create policy "Users can join a team"
  on public.team_members for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- Profiles
-- Auto-created on signup via trigger on auth.users
-- ============================================================
create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  email          text not null,
  full_name      text not null default '',
  role           text not null default 'closer' check (role in ('closer', 'setter', 'operator')),
  avatar_url     text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);


-- ============================================================
-- Call Logs
-- One row per day of calls logged by the user
-- ============================================================
create table if not exists public.call_logs (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  date             date not null,
  calls_taken      integer not null default 0 check (calls_taken >= 0),
  shows            integer not null default 0 check (shows >= 0),
  offers_made      integer not null default 0 check (offers_made >= 0),
  offers_taken     integer not null default 0 check (offers_taken >= 0),
  cash_collected   numeric(12, 2) not null default 0 check (cash_collected >= 0),
  commission_earned numeric(12, 2) not null default 0 check (commission_earned >= 0),
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  -- one entry per user per day
  unique (user_id, date)
);

alter table public.call_logs enable row level security;

create policy "Users can select own call logs"
  on public.call_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own call logs"
  on public.call_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own call logs"
  on public.call_logs for update
  using (auth.uid() = user_id);

create policy "Users can delete own call logs"
  on public.call_logs for delete
  using (auth.uid() = user_id);

create index call_logs_user_date_idx on public.call_logs (user_id, date desc);


-- ============================================================
-- Goals
-- Monthly targets per metric, one active goal set per user per month
-- ============================================================
create table if not exists public.goals (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references auth.users(id) on delete cascade,
  month                   date not null, -- stored as first day of month, e.g. 2026-04-01
  calls_target            integer not null default 0 check (calls_target >= 0),
  show_rate_target        numeric(5, 2) not null default 0 check (show_rate_target between 0 and 100),
  close_rate_target       numeric(5, 2) not null default 0 check (close_rate_target between 0 and 100),
  cash_target             numeric(12, 2) not null default 0 check (cash_target >= 0),
  commission_target       numeric(12, 2) not null default 0 check (commission_target >= 0),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  -- one goal set per user per month
  unique (user_id, month)
);

alter table public.goals enable row level security;

create policy "Users can select own goals"
  on public.goals for select
  using (auth.uid() = user_id);

create policy "Users can insert own goals"
  on public.goals for insert
  with check (auth.uid() = user_id);

create policy "Users can update own goals"
  on public.goals for update
  using (auth.uid() = user_id);

create policy "Users can delete own goals"
  on public.goals for delete
  using (auth.uid() = user_id);

create index goals_user_month_idx on public.goals (user_id, month desc);


-- ============================================================
-- Auto-update updated_at on row changes
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger call_logs_updated_at
  before update on public.call_logs
  for each row execute function public.handle_updated_at();

create trigger goals_updated_at
  before update on public.goals
  for each row execute function public.handle_updated_at();


-- ============================================================
-- Auto-create profile row when a new user signs up
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

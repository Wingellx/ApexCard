-- tracking_preference on profiles
alter table public.profiles
  add column if not exists tracking_preference text not null default 'daily'
    check (tracking_preference in ('daily', 'weekly'));

-- IO team (fixed UUID so other code can reference it as a constant)
insert into public.teams (id, name, description, invite_code)
values (
  '00000000-0000-0000-0000-000000000010',
  'Improvement Only',
  'The IO community — daily accountability, fitness, and high performance.',
  'IO-2025'
) on conflict (id) do nothing;

-- daily_checkins — stores both daily and weekly check-ins
-- weekly trackers use the Monday date of the check-in week
create table if not exists public.daily_checkins (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  checkin_date        date not null,
  workout_completed   boolean not null default false,
  work_units          integer not null default 0,  -- calls or hours depending on preference
  goal_completed      boolean not null default false,
  focus_rating        integer not null check (focus_rating >= 1 and focus_rating <= 10),
  accomplishment      text,
  score_work          integer not null default 0,   -- out of 35
  score_fitness       integer not null default 0,   -- out of 35
  score_accountability integer not null default 0,  -- out of 30
  performance_score   integer not null default 0,   -- total out of 100
  created_at          timestamptz not null default now(),
  constraint daily_checkins_user_date_unique unique (user_id, checkin_date)
);

alter table public.daily_checkins enable row level security;

create policy "users manage own checkins"
  on public.daily_checkins for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- training_splits — per-user weekly schedule (1=Mon … 7=Sun)
create table if not exists public.training_splits (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  day_of_week  integer not null check (day_of_week between 1 and 7),
  session_name text not null default 'Rest',
  updated_at   timestamptz not null default now(),
  constraint training_splits_user_day_unique unique (user_id, day_of_week)
);

alter table public.training_splits enable row level security;

create policy "users manage own training split"
  on public.training_splits for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- body_metrics — optional weight + up to 3 custom PRs
create table if not exists public.body_metrics (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.profiles(id) on delete cascade,
  log_date  date not null,
  weight_lbs numeric(5,1),
  pr1_name  text,
  pr1_value numeric(6,1),
  pr2_name  text,
  pr2_value numeric(6,1),
  pr3_name  text,
  pr3_value numeric(6,1),
  created_at timestamptz not null default now(),
  constraint body_metrics_user_date_unique unique (user_id, log_date)
);

alter table public.body_metrics enable row level security;

create policy "users manage own body metrics"
  on public.body_metrics for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

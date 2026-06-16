-- ============================================================
-- Ascendry: Business management tool for sales consultancy
-- ============================================================

-- Helper functions for RLS (security definer = bypass RLS when called)
create or replace function ascendry_user_role()
returns text language sql stable security definer as $$
  select role from ascendry_users where user_id = auth.uid()
$$;

create or replace function is_ascendry_user()
returns boolean language sql stable security definer as $$
  select exists (select 1 from ascendry_users where user_id = auth.uid())
$$;

-- ============================================================
-- ascendry_users: access control — who can use Ascendry
-- ============================================================
create table ascendry_users (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  role         text not null check (role in ('admin', 'delivery')),
  display_name text not null,
  created_at   timestamptz default now()
);

alter table ascendry_users enable row level security;

create policy "ascendry_users: read own row"
  on ascendry_users for select
  using (auth.uid() = user_id);

-- ============================================================
-- ascendry_prospects: outreach tracking
-- ============================================================
create table ascendry_prospects (
  id               uuid primary key default gen_random_uuid(),
  prospect_name    text not null,
  instagram_handle text,
  date_messaged    date not null default current_date,
  template_used    text check (template_used in ('A', 'B', 'C', 'D', 'E')),
  reply_status     text not null default 'No Reply'
                     check (reply_status in ('No Reply', 'Replied', 'Positive', 'Call Booked')),
  call_booked      boolean not null default false,
  notes            text,
  created_by       uuid references auth.users(id),
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

alter table ascendry_prospects enable row level security;

create policy "ascendry_prospects: admin full access"
  on ascendry_prospects for all
  using (ascendry_user_role() = 'admin')
  with check (ascendry_user_role() = 'admin');

-- ============================================================
-- ascendry_clients: client pipeline
-- ============================================================
create table ascendry_clients (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  amount_gbp  numeric(10,2),
  start_date  date,
  stage       text not null default 'Prospect'
                check (stage in ('Prospect', 'Replied', 'Call Booked', 'Closed', 'Active Client', '60-Day Review', 'Exited')),
  next_action text,
  notes       text,
  stage_order integer not null default 0,
  created_by  uuid references auth.users(id),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table ascendry_clients enable row level security;

create policy "ascendry_clients: ascendry users can read"
  on ascendry_clients for select
  using (is_ascendry_user());

create policy "ascendry_clients: ascendry users can insert"
  on ascendry_clients for insert
  with check (is_ascendry_user());

create policy "ascendry_clients: ascendry users can update"
  on ascendry_clients for update
  using (is_ascendry_user())
  with check (is_ascendry_user());

create policy "ascendry_clients: admin can delete"
  on ascendry_clients for delete
  using (ascendry_user_role() = 'admin');

-- ============================================================
-- ascendry_client_metrics: weekly metrics per client
-- ============================================================
create table ascendry_client_metrics (
  id                 uuid primary key default gen_random_uuid(),
  client_id          uuid not null references ascendry_clients(id) on delete cascade,
  week_starting      date not null,
  calls_booked       integer not null default 0,
  calls_taken        integer not null default 0,
  show_rate_pct      numeric(5,2),
  close_rate_pct     numeric(5,2),
  revenue_generated  numeric(10,2) not null default 0,
  logged_by          uuid references auth.users(id),
  created_at         timestamptz default now(),
  updated_at         timestamptz default now(),
  unique (client_id, week_starting)
);

alter table ascendry_client_metrics enable row level security;

create policy "ascendry_client_metrics: ascendry users can read"
  on ascendry_client_metrics for select
  using (is_ascendry_user());

create policy "ascendry_client_metrics: ascendry users can insert"
  on ascendry_client_metrics for insert
  with check (is_ascendry_user());

create policy "ascendry_client_metrics: ascendry users can update"
  on ascendry_client_metrics for update
  using (is_ascendry_user())
  with check (is_ascendry_user());

create policy "ascendry_client_metrics: admin can delete"
  on ascendry_client_metrics for delete
  using (ascendry_user_role() = 'admin');

-- ============================================================
-- ascendry_payments: revenue log
-- ============================================================
create table ascendry_payments (
  id           uuid primary key default gen_random_uuid(),
  payment_date date not null default current_date,
  client_name  text not null,
  amount_gbp   numeric(10,2) not null,
  is_overdue   boolean not null default false,
  notes        text,
  created_by   uuid references auth.users(id),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table ascendry_payments enable row level security;

create policy "ascendry_payments: admin full access"
  on ascendry_payments for all
  using (ascendry_user_role() = 'admin')
  with check (ascendry_user_role() = 'admin');

-- ============================================================
-- Seed Jacob as admin
-- (Replace the UUID below with Jacob's actual auth.users.id from Supabase)
-- Run after migration: see instructions in ASCENDRY_SETUP.md
-- ============================================================

-- To add Jacob (admin) and David (delivery) run these after creating their accounts:
--
-- insert into ascendry_users (user_id, role, display_name)
-- values
--   ('<JACOB_USER_ID>', 'admin', 'Jacob'),
--   ('<DAVID_USER_ID>', 'delivery', 'David');

-- ============================================================
-- Add verification columns to profiles
-- ============================================================
alter table public.profiles
  add column if not exists is_verified        boolean    not null default false,
  add column if not exists verified_by_name   text,
  add column if not exists verified_by_company text,
  add column if not exists verified_at        timestamptz;


-- ============================================================
-- Verification requests
-- ============================================================
create table if not exists public.verification_requests (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  manager_name     text not null,
  manager_company  text not null,
  manager_email    text not null,
  status           text not null default 'pending'
                     check (status in ('pending', 'verified', 'rejected')),
  verify_token     uuid not null unique default gen_random_uuid(),
  decline_token    uuid not null unique default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  verified_at      timestamptz
);

alter table public.verification_requests enable row level security;

-- Users can read their own requests
create policy "Users view own verification requests"
  on public.verification_requests for select
  using (auth.uid() = user_id);

-- Users can insert their own requests
create policy "Users insert own verification requests"
  on public.verification_requests for insert
  with check (auth.uid() = user_id);

-- Only one active (pending or verified) request per user at a time
create unique index verification_requests_active_unique
  on public.verification_requests (user_id)
  where status in ('pending', 'verified');

create index verification_requests_verify_token_idx
  on public.verification_requests (verify_token);

create index verification_requests_decline_token_idx
  on public.verification_requests (decline_token);

-- ============================================================
-- Owner portal additions
-- ============================================================

-- account_type: 'rep' = sales rep, 'owner' = offer owner / manager
alter table public.profiles
  add column if not exists account_type    text not null default 'rep'
    check (account_type in ('rep', 'owner')),
  add column if not exists verified_owner  boolean not null default false,
  add column if not exists discoverable    boolean not null default false,
  add column if not exists contact_enabled boolean not null default false;

-- ============================================================
-- Owner verification requests
-- Submitted during owner onboarding; admins approve/reject
-- ============================================================
create table if not exists public.owner_verification_requests (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade unique,
  full_name         text not null,
  company_name      text not null,
  company_website   text not null,
  offer_description text not null,
  status            text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  admin_notes       text,
  created_at        timestamptz not null default now(),
  reviewed_at       timestamptz
);

alter table public.owner_verification_requests enable row level security;

-- Owners can read their own request (to show pending page status)
create policy "Owners can read own verification request"
  on public.owner_verification_requests for select
  using (auth.uid() = user_id);

-- Owners can insert their own request (once — enforced by unique user_id)
create policy "Owners can insert own verification request"
  on public.owner_verification_requests for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- Owner shortlists
-- Verified owners can save/star reps they're interested in
-- ============================================================
create table if not exists public.owner_shortlists (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.profiles(id) on delete cascade,
  rep_id     uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (owner_id, rep_id)
);

alter table public.owner_shortlists enable row level security;

create policy "Owners can manage own shortlist"
  on public.owner_shortlists for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

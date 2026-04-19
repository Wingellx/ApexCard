-- Add subscription fields to profiles
alter table public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists subscription_status text not null default 'trialing'
    check (subscription_status in ('trialing', 'active', 'past_due', 'canceled', 'unpaid')),
  add column if not exists subscription_plan text
    check (subscription_plan in ('starter', 'pro') or subscription_plan is null),
  add column if not exists trial_ends_at timestamptz not null default (now() + interval '14 days'),
  add column if not exists current_period_end timestamptz;

-- contact_submissions table for landing page contact form
create table if not exists public.contact_submissions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  message     text not null,
  created_at  timestamptz not null default now()
);

-- Only service role can read contact submissions; anyone can insert
alter table public.contact_submissions enable row level security;

create policy "anyone can submit contact form"
  on public.contact_submissions for insert
  with check (true);

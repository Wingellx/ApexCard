create table if not exists public.waitlist (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  created_at timestamptz not null default now(),
  constraint waitlist_email_unique unique (email)
);

alter table public.waitlist enable row level security;

-- Anyone can insert; only service role reads
create policy "anyone can join waitlist"
  on public.waitlist for insert
  with check (true);

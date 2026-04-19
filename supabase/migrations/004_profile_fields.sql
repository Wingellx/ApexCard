alter table public.profiles
  add column if not exists username        text,
  add column if not exists commission_pct  numeric(5,2) not null default 0
    check (commission_pct >= 0 and commission_pct <= 100),
  add column if not exists bio             text not null default '';

-- Expand role constraint to include manager
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('closer', 'setter', 'operator', 'manager'));

-- Unique index; null values are excluded so multiple un-named users are fine
create unique index if not exists profiles_username_idx
  on public.profiles (username)
  where username is not null;

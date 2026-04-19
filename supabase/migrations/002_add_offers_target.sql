alter table public.goals
  add column if not exists offers_target integer not null default 0 check (offers_target >= 0);

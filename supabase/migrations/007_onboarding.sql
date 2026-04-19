alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false;

-- Existing users skip onboarding — they've already set up their accounts
update public.profiles
  set onboarding_completed = true
  where onboarding_completed = false;

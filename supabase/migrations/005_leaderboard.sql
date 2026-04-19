-- Add leaderboard opt-in flag to profiles
alter table public.profiles
  add column if not exists leaderboard_opt_in boolean not null default false;

-- All-time leaderboard: top 25 opted-in users by lifetime cash collected
create or replace function public.get_alltime_leaderboard()
returns table (
  id                uuid,
  name              text,
  username          text,
  role              text,
  total_cash        numeric,
  total_calls       bigint,
  total_shows       bigint,
  total_offers_taken bigint,
  close_rate        numeric
)
language sql
security definer
as $$
  select
    p.id,
    coalesce(nullif(trim(p.full_name), ''), split_part(p.email, '@', 1)) as name,
    p.username,
    p.role,
    coalesce(sum(cl.cash_collected), 0)::numeric          as total_cash,
    coalesce(sum(cl.calls_taken), 0)::bigint              as total_calls,
    coalesce(sum(cl.shows), 0)::bigint                    as total_shows,
    coalesce(sum(cl.offers_taken), 0)::bigint             as total_offers_taken,
    case when coalesce(sum(cl.shows), 0) > 0
      then (coalesce(sum(cl.offers_taken), 0)::numeric / sum(cl.shows)) * 100
      else 0
    end                                                    as close_rate
  from public.profiles p
  join public.call_logs cl on cl.user_id = p.id
  where p.leaderboard_opt_in = true
  group by p.id, p.full_name, p.email, p.username, p.role
  order by total_cash desc
  limit 25;
$$;

-- Monthly leaderboard: top 25 opted-in users by cash in a given month
create or replace function public.get_monthly_leaderboard(month_start date, month_end date)
returns table (
  id                uuid,
  name              text,
  username          text,
  role              text,
  total_cash        numeric,
  total_calls       bigint,
  total_shows       bigint,
  total_offers_taken bigint,
  close_rate        numeric
)
language sql
security definer
as $$
  select
    p.id,
    coalesce(nullif(trim(p.full_name), ''), split_part(p.email, '@', 1)) as name,
    p.username,
    p.role,
    coalesce(sum(cl.cash_collected), 0)::numeric          as total_cash,
    coalesce(sum(cl.calls_taken), 0)::bigint              as total_calls,
    coalesce(sum(cl.shows), 0)::bigint                    as total_shows,
    coalesce(sum(cl.offers_taken), 0)::bigint             as total_offers_taken,
    case when coalesce(sum(cl.shows), 0) > 0
      then (coalesce(sum(cl.offers_taken), 0)::numeric / sum(cl.shows)) * 100
      else 0
    end                                                    as close_rate
  from public.profiles p
  join public.call_logs cl on cl.user_id = p.id
  where p.leaderboard_opt_in = true
    and cl.date >= month_start
    and cl.date <= month_end
  group by p.id, p.full_name, p.email, p.username, p.role
  order by total_cash desc
  limit 25;
$$;

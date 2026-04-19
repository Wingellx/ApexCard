-- Unified leaderboard function with full filtering/sorting support
-- Replaces get_alltime_leaderboard() and get_monthly_leaderboard() calls
create or replace function public.get_leaderboard_v2(
  p_start_date  date    default null,   -- null = no start bound (all time)
  p_end_date    date    default null,   -- null = no end bound
  p_role        text    default null,   -- null = all roles
  p_verified    boolean default false,  -- true = verified users only
  p_order_by    text    default 'cash', -- cash | close_rate | calls | offers
  p_min_days    integer default 3       -- minimum days logged to appear
)
returns table (
  id                 uuid,
  name               text,
  username           text,
  role               text,
  is_verified        boolean,
  total_cash         numeric,
  total_calls        bigint,
  total_shows        bigint,
  total_offers_taken bigint,
  close_rate         numeric,
  days_logged        bigint
)
language sql
security definer
as $$
  with agg as (
    select
      p.id,
      coalesce(nullif(trim(p.full_name), ''), split_part(p.email, '@', 1)) as name,
      p.username,
      p.role,
      coalesce(p.is_verified, false)                                        as is_verified,
      coalesce(sum(cl.cash_collected), 0)::numeric                          as total_cash,
      coalesce(sum(cl.calls_taken),    0)::bigint                           as total_calls,
      coalesce(sum(cl.shows),          0)::bigint                           as total_shows,
      coalesce(sum(cl.offers_taken),   0)::bigint                           as total_offers_taken,
      case when coalesce(sum(cl.shows), 0) > 0
        then (coalesce(sum(cl.offers_taken), 0)::numeric / sum(cl.shows)) * 100
        else 0::numeric
      end                                                                    as close_rate,
      count(*)::bigint                                                       as days_logged
    from public.profiles p
    join public.call_logs cl on cl.user_id = p.id
    where p.leaderboard_opt_in = true
      and (p_start_date is null or cl.date >= p_start_date)
      and (p_end_date   is null or cl.date <= p_end_date)
      and (p_role       is null or p.role = p_role)
      and (p_verified = false or coalesce(p.is_verified, false) = true)
    group by p.id, p.full_name, p.email, p.username, p.role, p.is_verified
    having count(*) >= p_min_days
  )
  select *
  from agg
  order by (
    case p_order_by
      when 'cash'       then total_cash
      when 'close_rate' then close_rate
      when 'calls'      then total_calls::numeric
      when 'offers'     then total_offers_taken::numeric
      else                   total_cash
    end
  ) desc
  limit 25;
$$;

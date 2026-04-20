-- ============================================================
-- Public read policies for the /card/[username] page.
-- Without these, public (unauthenticated) requests fall back to
-- anon role, which has no read access on profiles or call_logs,
-- causing the card to 404 even when the user exists.
-- ============================================================

-- Profiles: anon can read any profile that has a username set.
-- (Setting a username is the user's opt-in to having a public card.)
create policy "Public can read profiles with username"
  on public.profiles for select
  to anon
  using (username is not null);

-- Call logs: anon can read logs for users who have a public card.
create policy "Public can read call logs for card users"
  on public.call_logs for select
  to anon
  using (
    exists (
      select 1 from public.profiles p
      where p.id = call_logs.user_id
        and p.username is not null
    )
  );

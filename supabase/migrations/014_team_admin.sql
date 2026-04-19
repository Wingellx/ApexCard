-- ============================================================
-- Team admin roles + admin-assignable training splits
-- ============================================================

-- 1. Role column on team_members
alter table public.team_members
  add column if not exists role text not null default 'member'
  check (role in ('member', 'admin'));

-- 2. assigned_by on training_splits
--    NULL  = user set their own split
--    non-null = admin of their team set it
alter table public.training_splits
  add column if not exists assigned_by uuid references public.profiles(id);

-- 3. Allow users to leave a team (delete own row)
create policy if not exists "Users can leave team"
  on public.team_members for delete
  using (auth.uid() = user_id);

-- 4. Allow admins to read ALL member training splits for their team
--    (regular SELECT policy only allows reading own row)
create policy if not exists "Team admins can read member splits"
  on public.training_splits for select
  using (
    auth.uid() = user_id
    or exists (
      select 1
      from public.team_members admin_row
      join public.team_members member_row
        on member_row.team_id = admin_row.team_id
       and member_row.user_id = training_splits.user_id
      where admin_row.user_id = auth.uid()
        and admin_row.role = 'admin'
    )
  );

-- Trello integration per IO member
create table if not exists public.trello_connections (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  token        text not null,
  board_id     text,
  board_name   text,
  connected_at timestamptz not null default now(),
  constraint trello_connections_user_unique unique (user_id)
);

alter table public.trello_connections enable row level security;

create policy "users manage own trello"
  on public.trello_connections for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

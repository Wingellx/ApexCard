-- ============================================================
-- Ascendry: Call Scripts & Playbook
-- Tracks diagnostic and close call sessions per pipeline card
-- ============================================================

create table ascendry_call_sessions (
  id                      uuid primary key default gen_random_uuid(),
  prospect_id             uuid references ascendry_prospects(id) on delete set null,
  client_id               uuid not null references ascendry_clients(id) on delete cascade,
  call_type               text not null default 'diagnostic'
                            check (call_type in ('diagnostic', 'close')),
  scheduled_at            timestamptz,
  status                  text not null default 'upcoming'
                            check (status in ('upcoming', 'in_progress', 'completed', 'no_show')),
  prep_notes              text,
  their_offer             text,
  their_price_point       text,
  leads_per_week          text,
  current_close_rate      text,
  follow_up_process       text,
  their_90_day_goal       text,
  urgency_level           text not null default 'medium'
                            check (urgency_level in ('low', 'medium', 'high')),
  decision_maker          boolean not null default true,
  second_decision_maker   text,
  key_phrases             text[] not null default '{}',
  emotional_signals       text,
  disqualification_flags  text[] not null default '{}',
  outcome                 text check (outcome in ('progressed', 'closed', 'lost', 'follow_up', 'disqualified')),
  outcome_notes           text,
  next_step               text,
  next_call_scheduled_at  timestamptz,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

alter table ascendry_call_sessions enable row level security;

create policy "ascendry_call_sessions: ascendry users can read"
  on ascendry_call_sessions for select
  using (is_ascendry_user());

create policy "ascendry_call_sessions: ascendry users can insert"
  on ascendry_call_sessions for insert
  with check (is_ascendry_user());

create policy "ascendry_call_sessions: ascendry users can update"
  on ascendry_call_sessions for update
  using (is_ascendry_user())
  with check (is_ascendry_user());

create policy "ascendry_call_sessions: admin can delete"
  on ascendry_call_sessions for delete
  using (ascendry_user_role() = 'admin');

create index ascendry_call_sessions_client_id_idx on ascendry_call_sessions(client_id);
create index ascendry_call_sessions_scheduled_at_idx on ascendry_call_sessions(scheduled_at);

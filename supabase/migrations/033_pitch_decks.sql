-- ============================================================
-- Ascendry: Pitch Deck Generator
-- One deck per client, editable fields auto-populated from prep
-- ============================================================

create table ascendry_pitch_decks (
  id                  uuid primary key default gen_random_uuid(),
  client_id           uuid not null references ascendry_clients(id) on delete cascade,
  prospect_id         uuid references ascendry_prospects(id) on delete set null,
  -- Slide 1: Title
  s1_name             text,
  s1_date             text,
  -- Slide 2: Where things stand
  s2_lead_stat        text,
  s2_close_rate       text,
  s2_follow_up        text,
  -- Slide 3: Cost of inaction
  s3_duration         text,
  s3_leads_cold       text,
  s3_close_rate       text,
  s3_revenue_left     text,
  -- Slide 7: Investment
  s7_price            text,
  s7_avg_value        text,
  s7_breakeven        text,
  s7_why_pays         text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now(),
  unique (client_id)
);

alter table ascendry_pitch_decks enable row level security;

create policy "ascendry_pitch_decks: ascendry users can read"
  on ascendry_pitch_decks for select
  using (is_ascendry_user());

create policy "ascendry_pitch_decks: ascendry users can insert"
  on ascendry_pitch_decks for insert
  with check (is_ascendry_user());

create policy "ascendry_pitch_decks: ascendry users can update"
  on ascendry_pitch_decks for update
  using (is_ascendry_user())
  with check (is_ascendry_user());

create policy "ascendry_pitch_decks: admin can delete"
  on ascendry_pitch_decks for delete
  using (ascendry_user_role() = 'admin');

create index ascendry_pitch_decks_client_id_idx on ascendry_pitch_decks(client_id);

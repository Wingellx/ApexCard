-- Add verification_start_date so managers only vouch for the period they worked with the rep
alter table public.verification_requests
  add column if not exists verification_start_date date;

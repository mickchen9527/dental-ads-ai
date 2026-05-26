-- V1.8 target settings draft.
-- Do not run automatically from the app. Execute manually in Supabase when ready.

create table if not exists public.target_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  label text not null,
  value numeric not null,
  unit text,
  description text,
  updated_at timestamptz default now()
);

comment on table public.target_settings is 'User-customizable threshold settings for recommendation rules.';
comment on column public.target_settings.key is 'Stable setting key, such as minimumClicks or lowRoi.';
comment on column public.target_settings.value is 'Numeric threshold value. Percentages are stored as decimals, for example 0.03 for 3%.';

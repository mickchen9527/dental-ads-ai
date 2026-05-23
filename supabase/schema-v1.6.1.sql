-- V1.6.1 Supabase 基础表结构草案
-- 只作为人工建表参考，不会在代码里自动执行。

create table if not exists uploaded_files (
  id uuid primary key default gen_random_uuid(),
  platform text,
  data_type text,
  original_file_name text,
  storage_path text,
  period_start date,
  period_end date,
  uploaded_at timestamptz default now(),
  row_count integer,
  parse_status text,
  is_active boolean default true,
  notes text
);

create table if not exists project_price_items (
  id uuid primary key default gen_random_uuid(),
  project_name text,
  project_category text,
  ekanya_system_price numeric,
  platform_display_price numeric,
  campaign_price numeric,
  common_actual_price numeric,
  package_content text,
  is_lead_project boolean default false,
  is_high_ticket boolean default false,
  observation_cycle text,
  status text default '启用',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists action_logs (
  id uuid primary key default gen_random_uuid(),
  action_date date,
  platform text,
  action_type text,
  title text,
  description text,
  status text,
  result text,
  review_date date,
  created_at timestamptz default now()
);

create table if not exists weekly_reports (
  id uuid primary key default gen_random_uuid(),
  report_type text,
  period_start date,
  period_end date,
  title text,
  summary text,
  file_path text,
  created_at timestamptz default now()
);

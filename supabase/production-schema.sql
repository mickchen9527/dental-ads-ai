-- Supabase production schema draft for dental-ads-ai.
-- Do not execute automatically from the app.
-- This file only creates tables and indexes if they do not already exist.
-- Review manually before running in Supabase.

create table if not exists public.uploaded_files (
  id uuid primary key default gen_random_uuid(),
  platform text,
  data_type text,
  original_file_name text,
  storage_path text,
  period_start date,
  period_end date,
  uploaded_at timestamptz default now(),
  row_count integer,
  parse_status text default 'saved',
  is_active boolean default true,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists uploaded_files_uploaded_at_idx on public.uploaded_files (uploaded_at desc);
create index if not exists uploaded_files_platform_idx on public.uploaded_files (platform);
create index if not exists uploaded_files_data_type_idx on public.uploaded_files (data_type);
create index if not exists uploaded_files_active_parse_idx on public.uploaded_files (is_active, parse_status);

comment on table public.uploaded_files is 'Uploaded original file records. Analysis APIs only use active parsed files.';

create table if not exists public.action_logs (
  id uuid primary key default gen_random_uuid(),
  action_type text not null,
  source text,
  recommendation_id text,
  platform text,
  title text,
  status text,
  note text,
  payload jsonb,
  created_at timestamptz default now(),
  execution_status text default 'pending',
  review_result text default 'unreviewed',
  review_note text,
  reviewed_at timestamptz,
  updated_at timestamptz default now()
);

create index if not exists action_logs_created_at_idx on public.action_logs (created_at desc);
create index if not exists action_logs_source_idx on public.action_logs (source);
create index if not exists action_logs_recommendation_id_idx on public.action_logs (recommendation_id);
create index if not exists action_logs_platform_idx on public.action_logs (platform);
create index if not exists action_logs_status_idx on public.action_logs (status);
create index if not exists action_logs_execution_status_idx on public.action_logs (execution_status);
create index if not exists action_logs_review_result_idx on public.action_logs (review_result);

comment on table public.action_logs is 'System action logs for recommendation adoption, watching, ignoring, execution and review.';

create table if not exists public.target_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  label text not null,
  value numeric not null,
  unit text,
  description text,
  updated_at timestamptz default now()
);

create index if not exists target_settings_key_idx on public.target_settings (key);

comment on table public.target_settings is 'User configurable threshold settings for recommendation rules.';

create table if not exists public.project_price_items (
  id uuid primary key default gen_random_uuid(),
  project_name text not null,
  project_category text,
  ekanya_system_price numeric,
  platform_display_price numeric,
  campaign_price numeric,
  common_actual_price numeric,
  package_content text,
  is_lead_project boolean default false,
  is_high_ticket boolean default false,
  observation_cycle text,
  status text default 'active',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists project_price_items_status_idx on public.project_price_items (status);
create index if not exists project_price_items_category_idx on public.project_price_items (project_category);
create index if not exists project_price_items_name_idx on public.project_price_items (project_name);

comment on table public.project_price_items is 'Project price management. This is not a cost table.';

create table if not exists public.competitor_price_items (
  id uuid primary key default gen_random_uuid(),
  hospital_name text not null,
  platform text default '美团',
  city_area text,
  project_category text,
  project_attribute text,
  project_name text not null,
  display_price numeric,
  original_price numeric,
  package_content text,
  restriction_note text,
  sold_count integer,
  rating numeric,
  review_count integer,
  page_url text,
  collected_date date default current_date,
  status text default 'active',
  notes text,
  raw_row jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists competitor_price_items_status_idx on public.competitor_price_items (status);
create index if not exists competitor_price_items_hospital_idx on public.competitor_price_items (hospital_name);
create index if not exists competitor_price_items_category_idx on public.competitor_price_items (project_category);
create index if not exists competitor_price_items_collected_date_idx on public.competitor_price_items (collected_date desc);
create index if not exists competitor_price_items_price_idx on public.competitor_price_items (display_price);

comment on table public.competitor_price_items is 'Manually collected public competitor price records. No private customer data should be stored here.';

create table if not exists public.meituan_summary_rows (
  id uuid primary key default gen_random_uuid(),
  uploaded_file_id uuid references public.uploaded_files(id) on delete cascade,
  date date,
  promotion_name text,
  store_name text,
  spend numeric,
  impressions integer,
  clicks integer,
  avg_click_cost numeric,
  merchant_views integer,
  phone_views integer,
  online_consult_clicks integer,
  orders integer,
  group_buy_orders integer,
  group_buy_orders_15d integer,
  raw_row jsonb,
  created_at timestamptz default now()
);

create index if not exists meituan_summary_rows_uploaded_file_id_idx on public.meituan_summary_rows (uploaded_file_id);
create index if not exists meituan_summary_rows_date_idx on public.meituan_summary_rows (date);

create table if not exists public.meituan_keyword_rows (
  id uuid primary key default gen_random_uuid(),
  uploaded_file_id uuid references public.uploaded_files(id) on delete cascade,
  date date,
  promotion_name text,
  store_name text,
  keyword text,
  spend numeric,
  impressions integer,
  clicks integer,
  avg_click_cost numeric,
  merchant_views integer,
  phone_views integer,
  online_consult_clicks integer,
  orders integer,
  group_buy_orders integer,
  group_buy_orders_15d integer,
  bid_price numeric,
  match_type text,
  keyword_status text,
  raw_row jsonb,
  created_at timestamptz default now()
);

create index if not exists meituan_keyword_rows_uploaded_file_id_idx on public.meituan_keyword_rows (uploaded_file_id);
create index if not exists meituan_keyword_rows_date_idx on public.meituan_keyword_rows (date);
create index if not exists meituan_keyword_rows_keyword_idx on public.meituan_keyword_rows (keyword);

create table if not exists public.douyin_plan_summary_rows (
  id uuid primary key default gen_random_uuid(),
  uploaded_file_id uuid references public.uploaded_files(id) on delete cascade,
  date date,
  account_name text,
  campaign_name text,
  plan_name text,
  ad_group_name text,
  spend numeric,
  impressions integer,
  clicks integer,
  click_rate numeric,
  avg_click_cost numeric,
  conversions integer,
  conversion_cost numeric,
  form_count integer,
  private_message_count integer,
  phone_count integer,
  raw_row jsonb,
  created_at timestamptz default now()
);

create index if not exists douyin_plan_summary_rows_uploaded_file_id_idx on public.douyin_plan_summary_rows (uploaded_file_id);
create index if not exists douyin_plan_summary_rows_date_idx on public.douyin_plan_summary_rows (date);

create table if not exists public.douyin_creative_rows (
  id uuid primary key default gen_random_uuid(),
  uploaded_file_id uuid references public.uploaded_files(id) on delete cascade,
  date date,
  account_name text,
  campaign_name text,
  plan_name text,
  ad_group_name text,
  creative_name text,
  material_name text,
  video_name text,
  creative_id text,
  material_id text,
  spend numeric,
  impressions integer,
  clicks integer,
  click_rate numeric,
  avg_click_cost numeric,
  play_count integer,
  valid_play_count integer,
  complete_play_count integer,
  complete_play_rate numeric,
  conversions integer,
  conversion_cost numeric,
  form_count integer,
  private_message_count integer,
  phone_count integer,
  raw_row jsonb,
  created_at timestamptz default now()
);

create index if not exists douyin_creative_rows_uploaded_file_id_idx on public.douyin_creative_rows (uploaded_file_id);
create index if not exists douyin_creative_rows_date_idx on public.douyin_creative_rows (date);
create index if not exists douyin_creative_rows_creative_name_idx on public.douyin_creative_rows (creative_name);

create table if not exists public.douyin_lead_rows (
  id uuid primary key default gen_random_uuid(),
  uploaded_file_id uuid references public.uploaded_files(id) on delete cascade,
  lead_time timestamptz,
  date date,
  account_name text,
  campaign_name text,
  plan_name text,
  ad_group_name text,
  creative_name text,
  material_name text,
  lead_type text,
  lead_source text,
  customer_name text,
  phone_tail text,
  city text,
  intention_project text,
  message_content text,
  follow_status text,
  appointment_status text,
  visit_status text,
  deal_status text,
  remark text,
  raw_row jsonb,
  created_at timestamptz default now()
);

create index if not exists douyin_lead_rows_uploaded_file_id_idx on public.douyin_lead_rows (uploaded_file_id);
create index if not exists douyin_lead_rows_date_idx on public.douyin_lead_rows (date);
create index if not exists douyin_lead_rows_status_idx on public.douyin_lead_rows (appointment_status, visit_status, deal_status);

create table if not exists public.gdt_plan_summary_rows (
  id uuid primary key default gen_random_uuid(),
  uploaded_file_id uuid references public.uploaded_files(id) on delete cascade,
  date date,
  account_name text,
  campaign_name text,
  plan_name text,
  ad_group_name text,
  spend numeric,
  impressions integer,
  clicks integer,
  click_rate numeric,
  avg_click_cost numeric,
  conversions integer,
  conversion_cost numeric,
  form_count integer,
  phone_count integer,
  consult_count integer,
  raw_row jsonb,
  created_at timestamptz default now()
);

create index if not exists gdt_plan_summary_rows_uploaded_file_id_idx on public.gdt_plan_summary_rows (uploaded_file_id);
create index if not exists gdt_plan_summary_rows_date_idx on public.gdt_plan_summary_rows (date);

create table if not exists public.gdt_creative_rows (
  id uuid primary key default gen_random_uuid(),
  uploaded_file_id uuid references public.uploaded_files(id) on delete cascade,
  date date,
  account_name text,
  campaign_name text,
  plan_name text,
  ad_group_name text,
  creative_name text,
  creative_id text,
  material_name text,
  material_id text,
  spend numeric,
  impressions integer,
  clicks integer,
  click_rate numeric,
  avg_click_cost numeric,
  conversions integer,
  conversion_cost numeric,
  form_count integer,
  phone_count integer,
  consult_count integer,
  raw_row jsonb,
  created_at timestamptz default now()
);

create index if not exists gdt_creative_rows_uploaded_file_id_idx on public.gdt_creative_rows (uploaded_file_id);
create index if not exists gdt_creative_rows_date_idx on public.gdt_creative_rows (date);
create index if not exists gdt_creative_rows_creative_name_idx on public.gdt_creative_rows (creative_name);

create table if not exists public.gdt_lead_rows (
  id uuid primary key default gen_random_uuid(),
  uploaded_file_id uuid references public.uploaded_files(id) on delete cascade,
  lead_time timestamptz,
  date date,
  account_name text,
  campaign_name text,
  plan_name text,
  ad_group_name text,
  creative_name text,
  lead_type text,
  lead_source text,
  customer_name text,
  phone_tail text,
  city text,
  intention_project text,
  consult_content text,
  follow_status text,
  appointment_status text,
  visit_status text,
  deal_status text,
  remark text,
  raw_row jsonb,
  created_at timestamptz default now()
);

create index if not exists gdt_lead_rows_uploaded_file_id_idx on public.gdt_lead_rows (uploaded_file_id);
create index if not exists gdt_lead_rows_date_idx on public.gdt_lead_rows (date);
create index if not exists gdt_lead_rows_status_idx on public.gdt_lead_rows (appointment_status, visit_status, deal_status);

create table if not exists public.amap_summary_rows (
  id uuid primary key default gen_random_uuid(),
  uploaded_file_id uuid references public.uploaded_files(id) on delete cascade,
  date date,
  account_name text,
  campaign_name text,
  plan_name text,
  store_name text,
  spend numeric,
  impressions integer,
  clicks integer,
  click_rate numeric,
  avg_click_cost numeric,
  phone_clicks integer,
  navigation_clicks integer,
  store_view_count integer,
  address_clicks integer,
  coupon_clicks integer,
  lead_count integer,
  raw_row jsonb,
  created_at timestamptz default now()
);

create index if not exists amap_summary_rows_uploaded_file_id_idx on public.amap_summary_rows (uploaded_file_id);
create index if not exists amap_summary_rows_date_idx on public.amap_summary_rows (date);

create table if not exists public.amap_action_rows (
  id uuid primary key default gen_random_uuid(),
  uploaded_file_id uuid references public.uploaded_files(id) on delete cascade,
  action_time timestamptz,
  date date,
  account_name text,
  campaign_name text,
  plan_name text,
  store_name text,
  action_type text,
  action_name text,
  phone_clicks integer,
  navigation_clicks integer,
  address_clicks integer,
  store_view_count integer,
  coupon_clicks integer,
  city text,
  keyword text,
  device_type text,
  raw_row jsonb,
  created_at timestamptz default now()
);

create index if not exists amap_action_rows_uploaded_file_id_idx on public.amap_action_rows (uploaded_file_id);
create index if not exists amap_action_rows_date_idx on public.amap_action_rows (date);
create index if not exists amap_action_rows_action_type_idx on public.amap_action_rows (action_type);

create table if not exists public.amap_lead_rows (
  id uuid primary key default gen_random_uuid(),
  uploaded_file_id uuid references public.uploaded_files(id) on delete cascade,
  lead_time timestamptz,
  date date,
  account_name text,
  campaign_name text,
  plan_name text,
  store_name text,
  lead_type text,
  lead_source text,
  customer_name text,
  phone_tail text,
  city text,
  intention_project text,
  consult_content text,
  follow_status text,
  appointment_status text,
  visit_status text,
  deal_status text,
  remark text,
  raw_row jsonb,
  created_at timestamptz default now()
);

create index if not exists amap_lead_rows_uploaded_file_id_idx on public.amap_lead_rows (uploaded_file_id);
create index if not exists amap_lead_rows_date_idx on public.amap_lead_rows (date);
create index if not exists amap_lead_rows_status_idx on public.amap_lead_rows (appointment_status, visit_status, deal_status);

create table if not exists public.ekanya_backflow_rows (
  id uuid primary key default gen_random_uuid(),
  uploaded_file_id uuid references public.uploaded_files(id) on delete cascade,
  source_date date,
  visit_date date,
  deal_date date,
  patient_name text,
  patient_no text,
  phone_tail text,
  source_platform text,
  source_channel text,
  intention_project text,
  visit_project text,
  deal_project text,
  appointment_status text,
  visit_status text,
  deal_status text,
  paid_amount numeric,
  receivable_amount numeric,
  discount_amount numeric,
  doctor_name text,
  consultant_name text,
  remark text,
  raw_row jsonb,
  created_at timestamptz default now()
);

create index if not exists ekanya_backflow_rows_uploaded_file_id_idx on public.ekanya_backflow_rows (uploaded_file_id);
create index if not exists ekanya_backflow_rows_source_date_idx on public.ekanya_backflow_rows (source_date);
create index if not exists ekanya_backflow_rows_visit_date_idx on public.ekanya_backflow_rows (visit_date);
create index if not exists ekanya_backflow_rows_deal_date_idx on public.ekanya_backflow_rows (deal_date);
create index if not exists ekanya_backflow_rows_source_platform_idx on public.ekanya_backflow_rows (source_platform);

create table if not exists public.weekly_reports (
  id uuid primary key default gen_random_uuid(),
  report_type text,
  period_start date,
  period_end date,
  title text,
  summary text,
  file_path text,
  created_at timestamptz default now()
);

create index if not exists weekly_reports_created_at_idx on public.weekly_reports (created_at desc);

comment on table public.weekly_reports is 'Legacy draft table for generated weekly report records. Current app mainly downloads CSV on the client.';

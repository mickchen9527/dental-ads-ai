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
  created_at timestamptz default now()
);

create index if not exists action_logs_created_at_idx on public.action_logs (created_at desc);
create index if not exists action_logs_source_idx on public.action_logs (source);
create index if not exists action_logs_recommendation_id_idx on public.action_logs (recommendation_id);

comment on table public.action_logs is '系统操作记录。当前用于记录今日总建议的采纳、继续观察和忽略动作。';
comment on column public.action_logs.action_type is '操作类型，例如 recommendation_adopted / recommendation_watching / recommendation_ignored。';
comment on column public.action_logs.source is '来源页面，例如 recommendations。';
comment on column public.action_logs.recommendation_id is '建议稳定 ID，用于刷新后恢复处理状态。';
comment on column public.action_logs.payload is '操作时的建议摘要，方便后续追溯。';

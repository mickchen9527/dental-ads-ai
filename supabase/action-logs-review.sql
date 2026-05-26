alter table public.action_logs
  add column if not exists execution_status text default 'pending',
  add column if not exists review_result text default 'unreviewed',
  add column if not exists review_note text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists updated_at timestamptz default now();

create index if not exists action_logs_execution_status_idx on public.action_logs (execution_status);
create index if not exists action_logs_review_result_idx on public.action_logs (review_result);

comment on column public.action_logs.execution_status is '建议是否执行：pending 未执行 / done 已执行 / delayed 暂缓 / cancelled 不执行。';
comment on column public.action_logs.review_result is '复盘结果：unreviewed 未复盘 / effective 有效 / ineffective 无效 / observing 继续观察。';
comment on column public.action_logs.review_note is '人工复盘备注。';
comment on column public.action_logs.reviewed_at is '最近一次复盘时间。';
comment on column public.action_logs.updated_at is '最近更新时间。';

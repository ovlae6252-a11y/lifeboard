-- AI 요약 작업 큐 테이블
create table if not exists public.summarize_jobs (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.news_article_groups(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  requested_by text not null default 'system',
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

-- 인덱스
create index idx_summarize_jobs_status on public.summarize_jobs(status);
create index idx_summarize_jobs_group_id on public.summarize_jobs(group_id);

-- RLS 활성화
alter table public.summarize_jobs enable row level security;

-- 인증 사용자 읽기 전용
create policy "인증 사용자 읽기" on public.summarize_jobs
  for select to authenticated using (true);

-- 인증 사용자 INSERT (수동 요약 요청용)
create policy "인증 사용자 생성" on public.summarize_jobs
  for insert to authenticated with check (true);

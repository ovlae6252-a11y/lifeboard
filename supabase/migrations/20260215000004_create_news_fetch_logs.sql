-- 뉴스 수집 로그 테이블
create table if not exists public.news_fetch_logs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.news_sources(id) on delete cascade,
  status text not null,
  articles_fetched integer not null default 0,
  articles_new integer not null default 0,
  error_message text,
  created_at timestamptz not null default now()
);

-- 인덱스
create index idx_news_fetch_logs_source_id on public.news_fetch_logs(source_id);
create index idx_news_fetch_logs_created_at on public.news_fetch_logs(created_at desc);

-- RLS 활성화 (정책 없음 = service_role만 접근)
alter table public.news_fetch_logs enable row level security;

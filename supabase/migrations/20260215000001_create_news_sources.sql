-- 뉴스 소스(RSS 피드) 테이블
create table if not exists public.news_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  feed_url text not null unique,
  category text not null check (category in ('politics', 'economy', 'society', 'culture', 'science', 'world')),
  is_active boolean not null default true,
  last_fetched_at timestamptz,
  created_at timestamptz not null default now()
);

-- RLS 활성화
alter table public.news_sources enable row level security;

-- 인증 사용자 읽기 전용
create policy "인증 사용자 읽기" on public.news_sources
  for select to authenticated using (true);

-- 뉴스 기사 그룹 테이블 (유사 기사 묶음)
create table if not exists public.news_article_groups (
  id uuid primary key default gen_random_uuid(),
  representative_article_id uuid, -- 대표 기사 (news_articles 생성 후 FK 추가)
  category text not null,
  article_count integer not null default 1,
  fact_summary text,
  is_summarized boolean not null default false,
  summarized_at timestamptz,
  created_at timestamptz not null default now()
);

-- RLS 활성화
alter table public.news_article_groups enable row level security;

-- 인증 사용자 읽기 전용
create policy "인증 사용자 읽기" on public.news_article_groups
  for select to authenticated using (true);

-- 뉴스 기사 테이블
create table if not exists public.news_articles (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.news_sources(id) on delete cascade,
  guid text not null,
  title text not null,
  title_normalized text not null,
  description text,
  original_url text not null,
  author text,
  category text not null,
  published_at timestamptz,
  image_url text,
  group_id uuid references public.news_article_groups(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(source_id, guid)
);

-- representative_article_id FK 추가
alter table public.news_article_groups
  add constraint fk_representative_article
  foreign key (representative_article_id) references public.news_articles(id)
  on delete set null;

-- 인덱스
create index idx_news_articles_group_id on public.news_articles(group_id);
create index idx_news_articles_published_at on public.news_articles(published_at desc);
create index idx_news_articles_category on public.news_articles(category);

-- RLS 활성화
alter table public.news_articles enable row level security;

-- 인증 사용자 읽기 전용
create policy "인증 사용자 읽기" on public.news_articles
  for select to authenticated using (true);

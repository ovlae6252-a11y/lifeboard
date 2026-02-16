-- news_articles 테이블에 is_deleted 컬럼 추가 (소프트 삭제)
alter table public.news_articles
  add column if not exists is_deleted boolean not null default false;

-- 성능 최적화를 위한 partial index (삭제되지 않은 기사만 인덱싱)
create index if not exists idx_news_articles_is_deleted
  on public.news_articles(is_deleted)
  where is_deleted = false;

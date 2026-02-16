-- news_article_groups 테이블에 is_valid 컬럼 추가 (그룹핑 품질 관리)
alter table public.news_article_groups
  add column if not exists is_valid boolean not null default true;

-- 성능 최적화를 위한 partial index (유효한 그룹만 인덱싱)
create index if not exists idx_news_article_groups_is_valid
  on public.news_article_groups(is_valid)
  where is_valid = true;

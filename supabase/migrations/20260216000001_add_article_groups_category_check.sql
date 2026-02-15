-- news_article_groups.category에 CHECK 제약 조건 추가
-- news_sources와 동일한 카테고리 값만 허용
alter table public.news_article_groups
  add constraint chk_article_groups_category
  check (category in ('politics', 'economy', 'society', 'culture', 'science', 'world'));

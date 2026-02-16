-- Add pg_trgm indexes for search optimization
-- 뉴스 그룹 팩트 요약 검색 인덱스
create index if not exists idx_fact_summary_trgm
  on news_article_groups
  using gin (fact_summary gin_trgm_ops);

-- 뉴스 기사 제목 검색 인덱스
create index if not exists idx_articles_title_trgm
  on news_articles
  using gin (title gin_trgm_ops);

-- 뉴스 그룹 조회 성능을 위한 인덱스 추가
-- queries.ts에서 ORDER BY created_at DESC + WHERE category = ? 사용

-- 카테고리 필터 + 최신순 정렬 복합 인덱스
create index idx_article_groups_category_created
  on public.news_article_groups(category, created_at desc);

-- 전체 목록 최신순 정렬 인덱스
create index idx_article_groups_created_at
  on public.news_article_groups(created_at desc);

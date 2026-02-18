-- [포토], [사진] 뉴스 필터링
-- 1) 블랙리스트에 키워드 추가 (이후 신규 수집 시 자동 차단)
-- 2) 기존 기사 soft delete 및 그룹 정합성 갱신

-- ============================================================
-- 1. content_filters 블랙리스트 키워드 추가
-- ============================================================
update content_filters
set keywords = keywords || array['[포토]', '[사진]'],
    updated_at = now()
where filter_type = 'blacklist'
  and is_active = true;

-- ============================================================
-- 2. 기존 기사 soft delete
-- ============================================================
update news_articles
set is_deleted = true
where is_deleted = false
  and (title ilike '%[포토]%' or title ilike '%[사진]%');

-- ============================================================
-- 3. 영향 받은 그룹의 article_count 재계산
--    (is_deleted = true인 기사의 group_id 기준으로 찾음)
-- ============================================================
update news_article_groups g
set article_count = (
  select count(*)::int
  from news_articles na
  where na.group_id = g.id
    and na.is_deleted = false
)
where g.id in (
  select distinct group_id
  from news_articles
  where (title ilike '%[포토]%' or title ilike '%[사진]%')
    and is_deleted = true
    and group_id is not null
);

-- ============================================================
-- 4. 대표 기사가 삭제된 그룹: 유효한 최신 기사로 대표 교체
-- ============================================================
update news_article_groups g
set representative_article_id = (
  select a.id
  from news_articles a
  where a.group_id = g.id
    and a.is_deleted = false
  order by a.published_at desc nulls last
  limit 1
)
where g.id in (
  select distinct group_id
  from news_articles
  where (title ilike '%[포토]%' or title ilike '%[사진]%')
    and is_deleted = true
    and group_id is not null
)
  and exists (
    select 1
    from news_articles a
    where a.id = g.representative_article_id
      and a.is_deleted = true
  );

-- ============================================================
-- 5. representative_published_at 갱신 (대표 기사 교체 반영)
-- ============================================================
update news_article_groups g
set representative_published_at = (
  select a.published_at
  from news_articles a
  where a.id = g.representative_article_id
)
where g.id in (
  select distinct group_id
  from news_articles
  where (title ilike '%[포토]%' or title ilike '%[사진]%')
    and is_deleted = true
    and group_id is not null
);

-- ============================================================
-- 6. 빈 그룹 삭제 (summarize_jobs CASCADE 자동 정리)
-- ============================================================
delete from news_article_groups
where article_count = 0;

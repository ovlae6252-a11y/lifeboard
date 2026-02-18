-- 뉴스 그룹 정렬 기준 개선: 그룹 생성일(created_at) → 대표 기사 발행일(representative_published_at)
-- PostgREST는 embedded join 컬럼으로 부모 행 정렬 불가 → 비정규화 컬럼 추가

-- ============================================================
-- 1. representative_published_at 컬럼 추가
-- ============================================================
alter table news_article_groups
  add column if not exists representative_published_at timestamptz;

-- ============================================================
-- 2. 기존 데이터 backfill
-- ============================================================
update news_article_groups g
set representative_published_at = a.published_at
from news_articles a
where a.id = g.representative_article_id
  and g.representative_published_at is null;

-- ============================================================
-- 3. 인덱스 생성
-- ============================================================

-- 단순 정렬용 인덱스 (전체 목록 조회)
create index if not exists idx_article_groups_rep_published
  on news_article_groups (representative_published_at desc nulls last);

-- 카테고리 필터 + 정렬 복합 인덱스
create index if not exists idx_article_groups_category_rep_published
  on news_article_groups (category, representative_published_at desc nulls last);

-- ============================================================
-- 4. batch_group_articles 함수 재정의
--    새 그룹 INSERT 및 article_count 갱신 시 representative_published_at 포함
-- ============================================================
create or replace function batch_group_articles(
  p_articles jsonb,
  p_similarity_threshold float default 0.4,
  p_hours_range int default 96
)
returns table (article_id uuid, group_id uuid, is_new_group boolean)
language plpgsql
security definer
as $$
declare
  art jsonb;
  v_article_id uuid;
  v_title_normalized text;
  v_category text;
  v_found_group_id uuid;
  v_affected_groups uuid[] := '{}';
begin
  for art in select * from jsonb_array_elements(p_articles)
  loop
    v_article_id := (art->>'article_id')::uuid;
    v_title_normalized := art->>'title_normalized';
    v_category := art->>'category';

    -- 이중 임계값 전략으로 유사 그룹 검색:
    -- 같은 카테고리: 유사도 >= p_similarity_threshold (기본 0.4)
    -- 다른 카테고리: 유사도 >= 0.7 (오탐 방지)
    select sub.group_id into v_found_group_id
    from (
      select a.group_id,
             similarity(a.title_normalized, v_title_normalized) as sim,
             a.category as art_category
      from news_articles a
      where a.group_id is not null
        and a.is_deleted = false
        and a.created_at >= now() - make_interval(hours => p_hours_range)
    ) sub
    where (
      (sub.art_category = v_category and sub.sim >= p_similarity_threshold)
      or
      (sub.art_category != v_category and sub.sim >= 0.7)
    )
    order by sub.sim desc
    limit 1;

    if v_found_group_id is not null then
      -- 기존 그룹에 할당
      update news_articles set group_id = v_found_group_id where id = v_article_id;
      v_affected_groups := array_append(v_affected_groups, v_found_group_id);

      article_id := v_article_id;
      group_id := v_found_group_id;
      is_new_group := false;
      return next;
    else
      -- 새 그룹 생성 + 할당 (representative_published_at 포함)
      insert into news_article_groups (
        category,
        article_count,
        representative_article_id,
        representative_published_at
      )
      select
        v_category,
        1,
        v_article_id,
        na.published_at
      from news_articles na
      where na.id = v_article_id
      returning id into v_found_group_id;

      update news_articles set group_id = v_found_group_id where id = v_article_id;
      v_affected_groups := array_append(v_affected_groups, v_found_group_id);

      article_id := v_article_id;
      group_id := v_found_group_id;
      is_new_group := true;
      return next;
    end if;
  end loop;

  -- 영향 받은 그룹의 article_count 및 representative_published_at 일괄 갱신
  update news_article_groups g
  set
    article_count = (
      select count(*)::int from news_articles na where na.group_id = g.id
    ),
    representative_published_at = (
      select a.published_at
      from news_articles a
      where a.id = g.representative_article_id
    )
  where g.id = any(v_affected_groups);
end;
$$;

-- anon/authenticated 호출 차단 (service_role 전용)
revoke execute on function batch_group_articles(jsonb, float, int) from anon, authenticated;

-- ============================================================
-- 5. search_news_groups 함수 재정의
--    2차 정렬 기준을 g.created_at → coalesce(g.representative_published_at, g.created_at) 로 변경
-- ============================================================
drop function if exists search_news_groups(text, text, int, int);

create or replace function search_news_groups(
  p_query text,
  p_category text default null,
  p_limit int default 20,
  p_offset int default 0
)
returns table (
  id uuid,
  category text,
  article_count int,
  fact_summary text,
  is_summarized boolean,
  created_at timestamptz,
  match_score real,
  representative_article jsonb,
  articles jsonb,
  total_count bigint
)
language plpgsql
stable
security definer
as $$
begin
  return query
  select
    g.id,
    g.category,
    g.article_count,
    g.fact_summary,
    g.is_summarized,
    g.created_at,
    -- match_score: fact_summary와 title의 similarity 중 최댓값
    greatest(
      similarity(coalesce(g.fact_summary, ''), p_query),
      similarity(coalesce(ra.title, ''), p_query)
    ) as match_score,
    -- representative_article JSONB
    case
      when ra.id is not null then
        jsonb_build_object(
          'id', ra.id,
          'title', ra.title,
          'original_url', ra.original_url,
          'image_url', ra.image_url,
          'published_at', ra.published_at,
          'source', jsonb_build_object(
            'id', s.id,
            'name', s.name
          )
        )
      else null
    end as representative_article,
    -- articles JSONB array (상위 4개)
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', a.id,
          'title', a.title,
          'original_url', a.original_url,
          'source', case
            when src.name is not null then jsonb_build_object('name', src.name)
            else null
          end
        )
      )
      from (
        select
          na.id,
          na.title,
          na.original_url,
          na.source_id,
          row_number() over (order by na.published_at desc nulls last) as rn
        from news_articles na
        where na.group_id = g.id
          and na.is_deleted = false
      ) a
      left join news_sources src on src.id = a.source_id
      where a.rn <= 4
    ) as articles,
    -- total_count: LIMIT/OFFSET 적용 전 전체 매칭 건수
    count(*) over() as total_count
  from news_article_groups g
  left join news_articles ra on ra.id = g.representative_article_id
  left join news_sources s on s.id = ra.source_id
  where
    -- 검색 조건: fact_summary 또는 title에 쿼리 포함
    (
      g.fact_summary ilike '%' || p_query || '%'
      or ra.title ilike '%' || p_query || '%'
    )
    -- 카테고리 필터 (선택적)
    and (p_category is null or g.category = p_category)
    -- 유효한 그룹만
    and g.is_valid = true
  order by match_score desc, coalesce(g.representative_published_at, g.created_at) desc
  limit p_limit
  offset p_offset;
end;
$$;

-- anon/authenticated 호출 차단 (service_role 전용)
revoke execute on function search_news_groups(text, text, int, int) from anon, authenticated;

-- 코멘트
comment on function search_news_groups is '뉴스 그룹 검색 (pg_trgm similarity 기반, representative_article + articles JSONB + total_count 포함, representative_published_at 기준 2차 정렬)';
comment on column news_article_groups.representative_published_at is '대표 기사 발행일 (비정규화 컬럼, 정렬 최적화용)';

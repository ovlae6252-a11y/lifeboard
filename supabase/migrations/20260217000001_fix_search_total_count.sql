-- 기존 함수 삭제 (반환 타입 변경을 위해)
drop function if exists search_news_groups(text, text, int, int);

-- 검색 함수에 total_count 추가 (window function으로 전체 매칭 건수 계산)
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
  order by match_score desc, g.created_at desc
  limit p_limit
  offset p_offset;
end;
$$;

-- anon/authenticated 호출 차단 (service_role 전용)
revoke execute on function search_news_groups(text, text, int, int) from anon, authenticated;

-- 코멘트
comment on function search_news_groups is '뉴스 그룹 검색 (pg_trgm similarity 기반, representative_article + articles JSONB + total_count 포함)';

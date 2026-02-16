-- 사용자 북마크 목록 조회 RPC 함수
-- user_bookmarks JOIN news_article_groups + representative_article
create or replace function get_user_bookmarks(
  p_user_id uuid,
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
  bookmarked_at timestamptz,
  representative_article jsonb,
  articles jsonb
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
    b.created_at as bookmarked_at,
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
          'source_name', src.name
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
    ) as articles
  from user_bookmarks b
  inner join news_article_groups g on g.id = b.group_id
  left join news_articles ra on ra.id = g.representative_article_id
  left join news_sources s on s.id = ra.source_id
  where b.user_id = p_user_id
  order by b.created_at desc
  limit p_limit
  offset p_offset;
end;
$$;

-- anon/authenticated 호출 차단 (service_role 전용)
revoke execute on function get_user_bookmarks(uuid, int, int) from anon, authenticated;

-- 코멘트
comment on function get_user_bookmarks is '사용자 북마크 목록 조회 (representative_article + articles JSONB 포함)';

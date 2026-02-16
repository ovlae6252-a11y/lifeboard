-- 그룹별 상위 N개 기사만 반환하는 RPC 함수
-- PostgREST embedded join은 per-group limit을 지원하지 않으므로,
-- ROW_NUMBER() 윈도우 함수로 그룹별 상위 기사만 추출한다.
create or replace function get_top_articles_for_groups(
  p_group_ids uuid[],
  p_limit_per_group int default 4
)
returns table (
  group_id uuid,
  id uuid,
  title text,
  original_url text,
  source_name text
)
language sql
stable
security definer
as $$
  select
    a.group_id,
    a.id,
    a.title,
    a.original_url,
    s.name as source_name
  from (
    select
      na.group_id,
      na.id,
      na.title,
      na.original_url,
      na.source_id,
      row_number() over (
        partition by na.group_id
        order by na.published_at desc nulls last
      ) as rn
    from news_articles na
    where na.group_id = any(p_group_ids)
  ) a
  left join news_sources s on s.id = a.source_id
  where a.rn <= p_limit_per_group;
$$;

-- anon/authenticated 호출 차단 (service_role 전용)
revoke execute on function get_top_articles_for_groups(uuid[], int) from anon, authenticated;

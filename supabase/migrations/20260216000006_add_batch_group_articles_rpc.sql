-- 배치 그룹핑 PL/pgSQL 함수
-- 기존 N번 순차 RPC 호출(find_similar_group + increment_article_count)을
-- 단일 트랜잭션 1번 호출로 대체하여 네트워크 왕복을 대폭 감소시킨다.
--
-- 입력: p_articles jsonb 배열 [{article_id, title_normalized, category}, ...]
-- 처리: 각 기사에 대해 유사 그룹 검색 → 있으면 할당, 없으면 새 그룹 생성
-- 출력: (article_id, group_id, is_new_group) 행 집합

create or replace function batch_group_articles(
  p_articles jsonb,
  p_similarity_threshold float default 0.6,
  p_hours_range int default 48
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

    -- 유사 그룹 검색 (find_similar_group 로직 인라인)
    -- 서브쿼리로 similarity() 중복 호출 방지
    select sub.group_id into v_found_group_id
    from (
      select a.group_id, similarity(a.title_normalized, v_title_normalized) as sim
      from news_articles a
      where a.group_id is not null
        and a.category = v_category
        and a.created_at >= now() - make_interval(hours => p_hours_range)
    ) sub
    where sub.sim >= p_similarity_threshold
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
      -- 새 그룹 생성 + 할당
      insert into news_article_groups (category, article_count, representative_article_id)
      values (v_category, 1, v_article_id)
      returning id into v_found_group_id;

      update news_articles set group_id = v_found_group_id where id = v_article_id;
      v_affected_groups := array_append(v_affected_groups, v_found_group_id);

      article_id := v_article_id;
      group_id := v_found_group_id;
      is_new_group := true;
      return next;
    end if;
  end loop;

  -- 영향 받은 그룹의 article_count 일괄 갱신
  update news_article_groups g
  set article_count = (
    select count(*)::int from news_articles na where na.group_id = g.id
  )
  where g.id = any(v_affected_groups);
end;
$$;

-- anon/authenticated 호출 차단 (service_role 전용)
revoke execute on function batch_group_articles(jsonb, float, int) from anon, authenticated;

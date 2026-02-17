-- 뉴스 그룹핑 개선: 이중 임계값 전략 + 기존 데이터 재그룹핑
-- 문제: 95.4%의 그룹이 기사 1개짜리 → 근본 원인 3가지 해결
-- 1. 카테고리 제약 제거 (이중 임계값으로 크로스 카테고리 허용)
-- 2. 유사도 임계값 완화 (0.5 → 0.4)
-- 3. 시간 범위 확장 (72시간 → 96시간)

-- ============================================================
-- 1. batch_group_articles 함수 개선
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

-- ============================================================
-- 2. find_similar_group 함수 개선 (일관성 유지)
-- ============================================================
create or replace function public.find_similar_group(
  p_title_normalized text,
  p_category text,
  p_similarity_threshold float default 0.4,
  p_hours_range integer default 96
)
returns table(group_id uuid, similarity float)
language sql
security definer
as $$
  -- 이중 임계값 전략:
  -- 같은 카테고리: 유사도 >= p_similarity_threshold
  -- 다른 카테고리: 유사도 >= 0.7
  select sub.group_id, sub.sim as similarity
  from (
    select
      a.group_id,
      similarity(a.title_normalized, p_title_normalized)::float as sim,
      a.category as art_category
    from public.news_articles a
    where a.group_id is not null
      and a.is_deleted = false
      and a.created_at >= now() - make_interval(hours => p_hours_range)
  ) sub
  where (
    (sub.art_category = p_category and sub.sim >= p_similarity_threshold)
    or
    (sub.art_category != p_category and sub.sim >= 0.7)
  )
  order by sub.sim desc
  limit 1;
$$;

-- anon/authenticated 호출 차단 (service_role 전용)
revoke execute on function public.find_similar_group(text, text, float, integer) from anon, authenticated;

-- ============================================================
-- 3. 일회성 재그룹핑: 미배정 기사 처리 (group_id IS NULL)
-- ============================================================
do $$
declare
  v_article record;
  v_found_group_id uuid;
  v_new_group_id uuid;
  v_assigned_count int := 0;
  v_new_group_count int := 0;
begin
  raise notice '미배정 기사 재그룹핑 시작...';

  for v_article in
    select id, title_normalized, category
    from news_articles
    where group_id is null
      and is_deleted = false
    order by created_at asc
  loop
    -- 이중 임계값으로 유사 그룹 검색 (시간 제한 없음)
    select sub.group_id into v_found_group_id
    from (
      select a.group_id,
             similarity(a.title_normalized, v_article.title_normalized) as sim,
             a.category as art_category
      from news_articles a
      where a.group_id is not null
        and a.is_deleted = false
    ) sub
    where (
      (sub.art_category = v_article.category and sub.sim >= 0.4)
      or
      (sub.art_category != v_article.category and sub.sim >= 0.7)
    )
    order by sub.sim desc
    limit 1;

    if v_found_group_id is not null then
      update news_articles set group_id = v_found_group_id where id = v_article.id;
      v_assigned_count := v_assigned_count + 1;
    else
      -- 새 그룹 생성
      insert into news_article_groups (category, article_count, representative_article_id)
      values (v_article.category, 1, v_article.id)
      returning id into v_new_group_id;

      update news_articles set group_id = v_new_group_id where id = v_article.id;
      v_new_group_count := v_new_group_count + 1;
    end if;
  end loop;

  -- article_count 재계산 (배정된 그룹들)
  update news_article_groups g
  set article_count = (
    select count(*)::int from news_articles na where na.group_id = g.id
  );

  raise notice '미배정 기사 처리 완료: 기존 그룹 배정 %, 새 그룹 생성 %',
    v_assigned_count, v_new_group_count;
end;
$$;

-- ============================================================
-- 4. 일회성 재그룹핑: 유사 단일 그룹 병합
-- ============================================================
do $$
declare
  v_source record;
  v_source_article record;
  v_target_group_id uuid;
  v_merged_count int := 0;
begin
  raise notice '단일 그룹 병합 시작...';

  -- 기사 1개짜리 그룹을 오래된 것부터 순회
  for v_source in
    select g.id as group_id, g.category, g.fact_summary
    from news_article_groups g
    where g.article_count <= 1
    order by g.created_at asc
  loop
    -- 소스 그룹의 대표 기사 조회
    select id, title_normalized, category
    into v_source_article
    from news_articles
    where group_id = v_source.group_id
      and is_deleted = false
    limit 1;

    if v_source_article.id is null then
      -- 기사 없는 빈 그룹 → 건너뜀 (이후 정리)
      continue;
    end if;

    -- 이중 임계값으로 다른 그룹에서 유사 기사 탐색
    select sub.group_id into v_target_group_id
    from (
      select a.group_id,
             similarity(a.title_normalized, v_source_article.title_normalized) as sim,
             a.category as art_category
      from news_articles a
      where a.group_id is not null
        and a.group_id != v_source.group_id
        and a.is_deleted = false
    ) sub
    where (
      (sub.art_category = v_source_article.category and sub.sim >= 0.4)
      or
      (sub.art_category != v_source_article.category and sub.sim >= 0.7)
    )
    order by sub.sim desc
    limit 1;

    if v_target_group_id is not null then
      -- 기사 이동
      update news_articles
      set group_id = v_target_group_id
      where group_id = v_source.group_id;

      -- 북마크 이관 (UNIQUE 제약 충돌 처리)
      -- 중복 발생 시 소스 북마크 삭제, 아니면 타겟으로 이관
      update user_bookmarks
      set group_id = v_target_group_id
      where group_id = v_source.group_id
        and not exists (
          select 1 from user_bookmarks ub2
          where ub2.user_id = user_bookmarks.user_id
            and ub2.group_id = v_target_group_id
        );

      delete from user_bookmarks where group_id = v_source.group_id;

      -- fact_summary 이관 (타겟에 요약 없고 소스에 있으면 복사)
      if v_source.fact_summary is not null then
        update news_article_groups
        set fact_summary = v_source.fact_summary
        where id = v_target_group_id
          and (fact_summary is null or fact_summary = '');
      end if;

      -- 소스 그룹 삭제 (summarize_jobs는 CASCADE로 자동 정리)
      delete from news_article_groups where id = v_source.group_id;

      v_merged_count := v_merged_count + 1;
    end if;
  end loop;

  raise notice '단일 그룹 병합 완료: % 그룹 병합됨', v_merged_count;
end;
$$;

-- ============================================================
-- 5. 정합성 보장: article_count 재계산 + 대표 기사 갱신 + 빈 그룹 삭제
-- ============================================================

-- 5-A: 모든 그룹의 article_count 재계산
update news_article_groups g
set article_count = (
  select count(*)::int
  from news_articles na
  where na.group_id = g.id
    and na.is_deleted = false
);

-- 5-B: article_count >= 2인 그룹의 representative_article_id를 최신 기사로 갱신
update news_article_groups g
set representative_article_id = (
  select a.id
  from news_articles a
  where a.group_id = g.id
    and a.is_deleted = false
  order by a.created_at desc
  limit 1
)
where g.article_count >= 2;

-- 5-C: 빈 그룹 삭제 (article_count = 0인 그룹, 대표 기사 유무 무관)
delete from news_article_groups
where article_count = 0;

-- ============================================================
-- 6. Ollama 재요약 작업 등록
-- ============================================================

-- 6-A: 기존 요약 결과 초기화 (그룹핑이 크게 변경되어 재요약 필요)
update news_article_groups
set fact_summary = null,
    is_summarized = false,
    summarized_at = null,
    is_valid = true
where article_count >= 1;

-- 6-B: 기존 pending/processing 작업 삭제 (partial unique index 충돌 방지)
delete from summarize_jobs
where status in ('pending', 'processing');

-- 6-C: 모든 유효 그룹에 대해 새 요약 작업 등록
insert into summarize_jobs (group_id, status, requested_by)
select id, 'pending', 'system-regroup'
from news_article_groups
where article_count >= 1
on conflict do nothing;

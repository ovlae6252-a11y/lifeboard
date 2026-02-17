-- LLM 배치 그룹핑 작업 큐 테이블
-- Ollama 워커가 폴링하여 같은 사건 기사들을 의미 기반으로 병합

create table if not exists public.grouping_jobs (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'failed')),
  article_ids uuid[] not null,
  error_message text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

-- 워커 폴링용 인덱스 (pending/processing 상태만)
create index idx_grouping_jobs_status_created
  on public.grouping_jobs(status, created_at)
  where status in ('pending', 'processing');

-- RLS 활성화 (service_role만 접근, anon/authenticated 차단)
alter table public.grouping_jobs enable row level security;

-- ============================================================
-- merge_groups RPC: 여러 소스 그룹을 하나의 타겟 그룹으로 병합
-- ============================================================
create or replace function public.merge_groups(
  p_source_ids uuid[],
  p_target_id uuid
)
returns void
language plpgsql
security definer
as $$
declare
  v_source_id uuid;
begin
  foreach v_source_id in array p_source_ids
  loop
    -- 소스 = 타겟이면 스킵
    if v_source_id = p_target_id then
      continue;
    end if;

    -- 기사 이동: 소스 그룹 → 타겟 그룹
    update news_articles
    set group_id = p_target_id
    where group_id = v_source_id;

    -- 북마크 이관: 중복 없으면 타겟으로, 이미 있으면 소스 북마크 삭제
    update user_bookmarks
    set group_id = p_target_id
    where group_id = v_source_id
      and not exists (
        select 1 from user_bookmarks ub2
        where ub2.user_id = user_bookmarks.user_id
          and ub2.group_id = p_target_id
      );

    delete from user_bookmarks where group_id = v_source_id;

    -- 소스 그룹 삭제 (summarize_jobs는 ON DELETE CASCADE로 자동 정리)
    delete from news_article_groups where id = v_source_id;
  end loop;

  -- 타겟 그룹 article_count 재계산
  update news_article_groups
  set article_count = (
    select count(*)::int
    from news_articles
    where group_id = p_target_id
      and is_deleted = false
  )
  where id = p_target_id;

  -- 타겟 그룹 representative_article_id를 최신 기사로 갱신
  update news_article_groups
  set representative_article_id = (
    select id
    from news_articles
    where group_id = p_target_id
      and is_deleted = false
    order by created_at desc
    limit 1
  )
  where id = p_target_id;
end;
$$;

-- anon/authenticated 호출 차단 (service_role 전용)
revoke execute on function public.merge_groups(uuid[], uuid) from anon, authenticated;

-- Realtime 활성화 (워커가 INSERT 이벤트 구독)
alter publication supabase_realtime add table public.grouping_jobs;

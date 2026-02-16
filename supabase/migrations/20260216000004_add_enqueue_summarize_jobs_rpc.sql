-- 요약 작업 일괄 등록 RPC 함수
-- 기존 for 루프 단건 INSERT를 1번의 호출로 대체
-- partial unique index(idx_summarize_jobs_active_per_group)가 중복 방지

create or replace function public.enqueue_summarize_jobs(
  p_group_ids uuid[],
  p_requested_by text default 'system'
)
returns int
language plpgsql
security definer
as $$
declare
  v_inserted int;
begin
  insert into public.summarize_jobs (group_id, status, requested_by)
  select unnest(p_group_ids), 'pending', p_requested_by
  on conflict do nothing;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

-- anon/authenticated 호출 차단 (service_role 전용)
revoke execute on function enqueue_summarize_jobs(uuid[], text) from anon, authenticated;

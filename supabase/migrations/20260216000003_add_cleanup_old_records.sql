-- 오래된 로그/작업 데이터 자동 정리 함수
-- news_fetch_logs: 90일 이전 삭제
-- summarize_jobs: 30일 이전 completed/failed 삭제

create or replace function public.cleanup_old_records()
returns jsonb
language plpgsql
security definer
as $$
declare
  v_logs_deleted int;
  v_jobs_deleted int;
begin
  -- 90일 이전 수집 로그 삭제
  delete from public.news_fetch_logs
  where created_at < now() - interval '90 days';
  get diagnostics v_logs_deleted = row_count;

  -- 30일 이전 완료/실패 요약 작업 삭제
  delete from public.summarize_jobs
  where status in ('completed', 'failed')
    and completed_at < now() - interval '30 days';
  get diagnostics v_jobs_deleted = row_count;

  return jsonb_build_object(
    'logs_deleted', v_logs_deleted,
    'jobs_deleted', v_jobs_deleted
  );
end;
$$;

-- anon/authenticated 호출 차단 (service_role 전용)
revoke execute on function cleanup_old_records() from anon, authenticated;

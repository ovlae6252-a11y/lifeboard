-- summarize_jobs 테이블에 Supabase Realtime 활성화
-- 워커가 postgres_changes 구독으로 새 작업을 즉시 감지할 수 있도록 설정
alter publication supabase_realtime add table public.summarize_jobs;

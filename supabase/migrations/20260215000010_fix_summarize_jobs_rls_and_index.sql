-- summarize_jobs RLS INSERT 정책 강화 + 중복 방지 partial unique index

-- 1. 기존 과도한 INSERT 정책 제거
drop policy if exists "인증 사용자 생성" on public.summarize_jobs;

-- 2. 강화된 INSERT 정책: pending 상태만 허용, requested_by는 사용자 이메일 고정
create policy "인증 사용자 생성" on public.summarize_jobs
  for insert to authenticated
  with check (
    status = 'pending'
    and requested_by = (select auth.email())
  );

-- 3. 레이스 컨디션 방지: 동일 그룹에 pending/processing 작업 중복 생성 방지
create unique index if not exists idx_summarize_jobs_active_per_group
  on public.summarize_jobs (group_id)
  where status in ('pending', 'processing');

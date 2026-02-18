-- 관리자 감사 로그 테이블 생성
-- 관리자 작업 이력을 기록하여 서비스 운영 투명성 확보

create table admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id) not null,
  action text not null,
  target_type text not null,
  target_id text,
  details jsonb default '{}',
  created_at timestamptz default now()
);

-- RLS 활성화
alter table admin_audit_logs enable row level security;

-- 정책: 관리자 역할이 있는 인증 사용자만 조회 가능
create policy "관리자는 감사 로그를 조회할 수 있다"
  on admin_audit_logs
  for select
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- 인덱스: admin_id 조회 최적화
create index idx_admin_audit_logs_admin_id
  on admin_audit_logs(admin_id);

-- 인덱스: 최신순 조회 최적화
create index idx_admin_audit_logs_created_at
  on admin_audit_logs(created_at desc);

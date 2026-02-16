-- user_preferences 테이블 생성
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferred_categories jsonb default '[]'::jsonb not null,
  dashboard_config jsonb default '{}'::jsonb not null,
  email_digest_enabled boolean default false not null,
  weather_location text default 'seoul' not null,
  updated_at timestamptz default now() not null
);

-- RLS 활성화
alter table public.user_preferences enable row level security;

-- RLS 정책: 본인 데이터만 조회
create policy "Users can view own preferences"
  on public.user_preferences
  for select
  using (auth.uid() = user_id);

-- RLS 정책: 본인 데이터만 삽입
create policy "Users can insert own preferences"
  on public.user_preferences
  for insert
  with check (auth.uid() = user_id);

-- RLS 정책: 본인 데이터만 수정
create policy "Users can update own preferences"
  on public.user_preferences
  for update
  using (auth.uid() = user_id);

-- 코멘트
comment on table public.user_preferences is '사용자 개인 설정 (카테고리 선호도, 대시보드 구성 등)';
comment on column public.user_preferences.user_id is '사용자 ID (PK, FK to auth.users)';
comment on column public.user_preferences.preferred_categories is '선호 뉴스 카테고리 배열';
comment on column public.user_preferences.dashboard_config is '대시보드 레이아웃 설정';
comment on column public.user_preferences.email_digest_enabled is '이메일 다이제스트 수신 여부';
comment on column public.user_preferences.weather_location is '날씨 정보 표시 위치';
comment on column public.user_preferences.updated_at is '마지막 수정 시각';

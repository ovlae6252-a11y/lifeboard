-- user_bookmarks 테이블 생성
create table if not exists public.user_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  group_id uuid not null references public.news_article_groups(id) on delete cascade,
  created_at timestamptz default now() not null,
  constraint unique_user_group unique (user_id, group_id)
);

-- 인덱스 생성
create index if not exists idx_bookmarks_user on public.user_bookmarks(user_id);
create index if not exists idx_bookmarks_group on public.user_bookmarks(group_id);
create index if not exists idx_bookmarks_created_at on public.user_bookmarks(created_at desc);

-- RLS 활성화
alter table public.user_bookmarks enable row level security;

-- RLS 정책: 본인 북마크만 조회
create policy "Users can view own bookmarks"
  on public.user_bookmarks
  for select
  using (auth.uid() = user_id);

-- RLS 정책: 본인 북마크만 삽입
create policy "Users can insert own bookmarks"
  on public.user_bookmarks
  for insert
  with check (auth.uid() = user_id);

-- RLS 정책: 본인 북마크만 삭제
create policy "Users can delete own bookmarks"
  on public.user_bookmarks
  for delete
  using (auth.uid() = user_id);

-- 코멘트
comment on table public.user_bookmarks is '사용자 뉴스 북마크 (최대 100개 제한은 애플리케이션 레벨에서 처리)';
comment on column public.user_bookmarks.id is '북마크 ID (PK)';
comment on column public.user_bookmarks.user_id is '사용자 ID (FK to auth.users)';
comment on column public.user_bookmarks.group_id is '뉴스 그룹 ID (FK to news_article_groups)';
comment on column public.user_bookmarks.created_at is '북마크 생성 시각';

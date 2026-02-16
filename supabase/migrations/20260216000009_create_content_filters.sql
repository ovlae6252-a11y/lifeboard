-- 콘텐츠 필터링 키워드 관리 테이블
create table if not exists public.content_filters (
  id uuid primary key default gen_random_uuid(),
  filter_type text not null check (filter_type in ('blacklist', 'whitelist')),
  keywords text[] not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 인덱스
create index if not exists idx_content_filters_type_active
  on public.content_filters(filter_type, is_active)
  where is_active = true;

-- RLS 활성화
alter table public.content_filters enable row level security;

-- 인증 사용자 읽기 전용 (service_role만 수정 가능)
create policy "인증 사용자 읽기" on public.content_filters
  for select to authenticated using (true);

-- updated_at 자동 갱신 트리거
create or replace function public.update_content_filters_updated_at()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trigger_update_content_filters_updated_at
  before update on public.content_filters
  for each row
  execute function public.update_content_filters_updated_at();

-- 초기 시드 데이터: 블랙리스트 키워드 (광고, 스팸성 컨텐츠)
insert into public.content_filters (filter_type, keywords, is_active)
values
  ('blacklist', array['광고', '홍보', '이벤트', '할인', '쿠폰', '프로모션', '부고', '모집', '채용', '알바'], true)
on conflict do nothing;

-- 초기 시드 데이터: 화이트리스트 키워드 (뉴스 가치 있는 주제)
insert into public.content_filters (filter_type, keywords, is_active)
values
  ('whitelist', array['정치', '경제', '사회', '국제', '문화', '과학', '기술', 'IT', '스포츠'], true)
on conflict do nothing;

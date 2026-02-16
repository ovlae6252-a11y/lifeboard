-- news_fetch_logs 테이블에 filtered_count 컬럼 추가 (필터링된 기사 수 통계)
alter table public.news_fetch_logs
  add column if not exists filtered_count integer not null default 0;

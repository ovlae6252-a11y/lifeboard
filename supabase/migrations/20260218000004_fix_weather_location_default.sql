-- weather_location 기본값을 한국어로 통일
-- 기존 영문 기본값('seoul')으로 저장된 행 업데이트
update public.user_preferences
set weather_location = '서울'
where weather_location = 'seoul';

-- 컬럼 기본값 변경
alter table public.user_preferences
  alter column weather_location set default '서울';

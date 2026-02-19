-- 수집 실패 RSS 소스 수정
-- URL이 404이거나 접근 불가한 소스를 비활성화

-- 테스트 결과: 아래 소스들의 RSS URL이 404 또는 에러 반환
-- - 동아일보: donga.com/rss/*.xml → 404 (URL 구조 변경)
-- - 매일경제: mk.co.kr/rss/*.xml → 404 (URL 구조 변경)
-- - 중앙일보: joongang.co.kr/rss/*.xml → 404 (URL 구조 변경)
-- - KBS 뉴스: kbs.co.kr/news/rss/news.xml → 404
-- - MBC 뉴스: imnews.imbc.com/rss/news.xml → 301→에러페이지
-- - 경향신문: khan.co.kr/rss/*.xml → 접근 차단 (SSL 오류)
-- - 서울신문: seoul.co.kr/rss/*.xml → 접근 차단 (SSL 오류)

-- 동아일보 소스 비활성화
update news_sources
set is_active = false
where name in ('동아일보 경제', '동아일보 정치');

-- 매일경제 소스 비활성화
update news_sources
set is_active = false
where name in ('매일경제 경제', '매일경제 산업');

-- 중앙일보 소스 비활성화
update news_sources
set is_active = false
where name in ('중앙일보 경제', '중앙일보 정치');

-- KBS/MBC 소스 비활성화 (URL 404/에러)
update news_sources
set is_active = false
where name in ('KBS 뉴스', 'MBC 뉴스');

-- 경향신문 소스 비활성화 (SSL 차단)
update news_sources
set is_active = false
where name in ('경향신문 정치', '경향신문 사회');

-- 서울신문 소스 비활성화 (SSL 차단)
update news_sources
set is_active = false
where name in ('서울신문 정치', '서울신문 사회');

-- 현재 활성 소스 현황 확인용 (실행 후 확인)
-- select name, category, is_active, last_fetched_at from news_sources order by is_active desc, category, name;

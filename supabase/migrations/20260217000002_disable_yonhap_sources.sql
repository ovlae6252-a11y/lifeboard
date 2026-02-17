-- 연합뉴스 RSS 소스 비활성화
-- SSL 구버전 재협상 이슈로 이미지 로드 실패 (ERR_SSL_UNSAFE_LEGACY_RENEGOTIATION_DISABLED)
-- 신규 수집은 중단하되 기존 수집된 기사는 유지

update news_sources
set is_active = false
where feed_url ilike '%yna.co.kr%'
   or feed_url ilike '%yonhapnews.co.kr%';

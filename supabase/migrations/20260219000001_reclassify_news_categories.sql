-- 뉴스 카테고리 재분류 마이그레이션
-- 종합 뉴스 소스(조선일보 종합, SBS, KBS, MBC)의 기사를 제목 키워드로 재분류하고
-- 그룹 카테고리를 소속 기사 다수결로 재계산

-- 1단계: 종합 소스 기사 카테고리 재분류 (제목 키워드 기반, 우선순위 순)
-- 대상 소스: 조선일보 종합, SBS 뉴스, KBS 뉴스, MBC 뉴스
with comprehensive_sources as (
  select id from news_sources
  where name in ('조선일보 종합', 'SBS 뉴스', 'KBS 뉴스', 'MBC 뉴스')
)
update news_articles
set category = case
  -- 세계/국제: 외국 국가명, 국제기구, 외국 인물
  when title ~* '미국|중국|일본|러시아|유럽|우크라이나|이스라엘|가자|나토|유엔|트럼프|바이든|시진핑|푸틴|북한.*외교|한반도|이란|사우디|팔레스타인|대만해협|인도|캐나다|호주|영국|독일|프랑스|이탈리아|브라질|멕시코|G7|G20|IMF|WHO|WTO|NATO|아프가니스탄|중동|아시아|아프리카|남미'
    then 'world'
  -- 정치: 정치 기관, 인물, 선거 관련
  when title ~* '대통령|국회|여당|야당|총리|장관|국무|탄핵|선거|민주당|국민의힘|더불어|정부|국무총리|의원|국무회의|헌재|헌법재판소|검찰|법무부|국방부|외교부|청와대|용산|집권|야권|여권|대선|총선|지방선거|비례|공천|임명|내각|총리후보|특검|청문회|국정|여론조사'
    then 'politics'
  -- 경제: 금융, 산업, 기업 관련
  when title ~* '주가|코스피|코스닥|금리|환율|물가|부동산|아파트|주식|채권|수출|무역|GDP|삼성전자|LG전자|현대차|기아|SK하이닉스|카카오|네이버|취업|실업|경제|기업|산업|투자|증권|은행|금융|보험|무역수지|경상수지|인플레|적자|흑자|상장|IPO|배당|코인|가상화폐|비트코인|부채|세금|세율|예산|재정|스타트업|벤처'
    then 'economy'
  -- IT/과학: 기술, 과학, 디지털 관련
  when title ~* '인공지능|AI |반도체|스마트폰|아이폰|갤럭시|챗GPT|ChatGPT|우주|과학기술|IT |기술혁신|디지털|사이버|해킹|블록체인|클라우드|5G|6G|드론|로봇|자율주행|메타버스|AR |VR |플랫폼|GPU|딥러닝|머신러닝|오픈AI|엔비디아|앱 서비스'
    then 'science'
  -- 문화/연예/스포츠
  when title ~* '영화|드라마|음악|K팝|BTS|아이돌|연예|공연|전시|축구|야구|농구|배구|올림픽|아시안게임|월드컵|선수|감독|스포츠|문화예술|방탄|블랙핑크|뮤지컬|콘서트|골프|테니스|수영|육상|배드민턴|태권도|리그|경기 결과'
    then 'culture'
  -- 매칭 없으면 기존 society 유지
  else category
end
where source_id in (select id from comprehensive_sources)
  and is_deleted = false;

-- 2단계: 뉴스 그룹 카테고리를 소속 기사 다수결로 재계산
-- 종합 소스 기사가 포함된 그룹만 업데이트
with article_categories as (
  select
    na.group_id,
    na.category,
    count(*) as cnt
  from news_articles na
  where na.group_id is not null
    and na.is_deleted = false
    and na.source_id in (
      select id from news_sources
      where name in ('조선일보 종합', 'SBS 뉴스', 'KBS 뉴스', 'MBC 뉴스')
    )
  group by na.group_id, na.category
),
majority_category as (
  select distinct on (group_id)
    group_id,
    category
  from article_categories
  order by group_id, cnt desc
)
update news_article_groups nag
set category = mc.category
from majority_category mc
where nag.id = mc.group_id;

-- 3단계: 소속 기사 카테고리가 다양한 모든 그룹의 카테고리 재계산 (전체 기사 기준)
-- 그룹에서 가장 많은 카테고리를 가진 기사의 카테고리로 그룹 카테고리 결정
with all_article_categories as (
  select
    na.group_id,
    na.category,
    count(*) as cnt
  from news_articles na
  where na.group_id is not null
    and na.is_deleted = false
  group by na.group_id, na.category
),
group_majority as (
  select distinct on (group_id)
    group_id,
    category
  from all_article_categories
  order by group_id, cnt desc
)
update news_article_groups nag
set category = gm.category
from group_majority gm
where nag.id = gm.group_id
  and nag.category != gm.category;

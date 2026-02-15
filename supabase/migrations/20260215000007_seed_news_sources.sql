-- 한국 주요 언론사 RSS 피드 시드 데이터
insert into public.news_sources (name, feed_url, category) values
  -- 정치
  ('연합뉴스 정치', 'https://www.yna.co.kr/rss/politics.xml', 'politics'),
  ('한겨레 정치', 'https://www.hani.co.kr/rss/politics/', 'politics'),

  -- 경제
  ('연합뉴스 경제', 'https://www.yna.co.kr/rss/economy.xml', 'economy'),
  ('한국경제 경제', 'https://www.hankyung.com/feed/economy', 'economy'),

  -- 사회
  ('연합뉴스 사회', 'https://www.yna.co.kr/rss/society.xml', 'society'),
  ('한겨레 사회', 'https://www.hani.co.kr/rss/society/', 'society'),

  -- 생활/문화
  ('연합뉴스 문화', 'https://www.yna.co.kr/rss/culture.xml', 'culture'),
  ('한겨레 문화', 'https://www.hani.co.kr/rss/culture/', 'culture'),

  -- IT/과학
  ('연합뉴스 과학', 'https://www.yna.co.kr/rss/science.xml', 'science'),
  ('한겨레 과학', 'https://www.hani.co.kr/rss/science/', 'science'),

  -- 세계
  ('연합뉴스 세계', 'https://www.yna.co.kr/rss/international.xml', 'world'),
  ('한겨레 세계', 'https://www.hani.co.kr/rss/international/', 'world'),

  -- 종합
  ('조선일보 종합', 'https://www.chosun.com/arc/outboundfeeds/rss/?outputType=xml', 'society')

on conflict (feed_url) do nothing;

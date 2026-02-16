-- batch_group_articles RPC 함수 파라미터 변경
-- 유사도 임계값: 0.6 -> 0.5 (더 넓은 범위로 그룹핑)
-- 시간 범위: 48시간 -> 72시간 (3일)

create or replace function batch_group_articles(
  p_articles jsonb,
  p_similarity_threshold float default 0.5,
  p_hours_range int default 72
)
returns table (article_id uuid, group_id uuid, is_new_group boolean)
language plpgsql
security definer
as $$
declare
  art jsonb;
  v_article_id uuid;
  v_title_normalized text;
  v_category text;
  v_found_group_id uuid;
  v_affected_groups uuid[] := '{}';
begin
  for art in select * from jsonb_array_elements(p_articles)
  loop
    v_article_id := (art->>'article_id')::uuid;
    v_title_normalized := art->>'title_normalized';
    v_category := art->>'category';

    -- 유사 그룹 검색 (find_similar_group 로직 인라인)
    -- 서브쿼리로 similarity() 중복 호출 방지
    select sub.group_id into v_found_group_id
    from (
      select a.group_id, similarity(a.title_normalized, v_title_normalized) as sim
      from news_articles a
      where a.group_id is not null
        and a.category = v_category
        and a.created_at >= now() - make_interval(hours => p_hours_range)
    ) sub
    where sub.sim >= p_similarity_threshold
    order by sub.sim desc
    limit 1;

    if v_found_group_id is not null then
      -- 기존 그룹에 할당
      update news_articles set group_id = v_found_group_id where id = v_article_id;
      v_affected_groups := array_append(v_affected_groups, v_found_group_id);

      article_id := v_article_id;
      group_id := v_found_group_id;
      is_new_group := false;
      return next;
    else
      -- 새 그룹 생성 + 할당
      insert into news_article_groups (category, article_count, representative_article_id)
      values (v_category, 1, v_article_id)
      returning id into v_found_group_id;

      update news_articles set group_id = v_found_group_id where id = v_article_id;
      v_affected_groups := array_append(v_affected_groups, v_found_group_id);

      article_id := v_article_id;
      group_id := v_found_group_id;
      is_new_group := true;
      return next;
    end if;
  end loop;

  -- 영향 받은 그룹의 article_count 일괄 갱신
  update news_article_groups g
  set article_count = (
    select count(*)::int from news_articles na where na.group_id = g.id
  )
  where g.id = any(v_affected_groups);
end;
$$;

-- anon/authenticated 호출 차단 (service_role 전용)
revoke execute on function batch_group_articles(jsonb, float, int) from anon, authenticated;

-- 추가 RSS 소스 등록 (20개+ 확대)
insert into public.news_sources (name, feed_url, category) values
  -- 중앙일보
  ('중앙일보 정치', 'https://www.joongang.co.kr/rss/politics.xml', 'politics'),
  ('중앙일보 경제', 'https://www.joongang.co.kr/rss/economy.xml', 'economy'),

  -- 서울신문
  ('서울신문 정치', 'https://www.seoul.co.kr/rss/politics.xml', 'politics'),
  ('서울신문 사회', 'https://www.seoul.co.kr/rss/society.xml', 'society'),

  -- 매일경제
  ('매일경제 경제', 'https://www.mk.co.kr/rss/economy.xml', 'economy'),
  ('매일경제 산업', 'https://www.mk.co.kr/rss/industry.xml', 'economy'),

  -- 동아일보
  ('동아일보 정치', 'https://www.donga.com/rss/politics.xml', 'politics'),
  ('동아일보 경제', 'https://www.donga.com/rss/economy.xml', 'economy'),

  -- 경향신문
  ('경향신문 정치', 'https://www.khan.co.kr/rss/politics.xml', 'politics'),
  ('경향신문 사회', 'https://www.khan.co.kr/rss/society.xml', 'society'),

  -- JTBC
  ('JTBC 정치', 'https://fs.jtbc.co.kr/RSS/politics.xml', 'politics'),
  ('JTBC 사회', 'https://fs.jtbc.co.kr/RSS/society.xml', 'society'),

  -- KBS
  ('KBS 뉴스', 'https://www.kbs.co.kr/news/rss/news.xml', 'society'),

  -- MBC
  ('MBC 뉴스', 'https://imnews.imbc.com/rss/news.xml', 'society'),

  -- SBS
  ('SBS 뉴스', 'https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=01', 'society')

on conflict (feed_url) do nothing;

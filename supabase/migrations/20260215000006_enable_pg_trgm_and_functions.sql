-- pg_trgm 확장 활성화 (트라이그램 유사도 검색)
create extension if not exists pg_trgm;

-- 정규화된 제목에 GIN 인덱스 (유사도 검색 성능)
create index idx_news_articles_title_trgm
  on public.news_articles
  using gin (title_normalized gin_trgm_ops);

-- 유사 그룹 찾기 RPC
-- 같은 카테고리 + 최근 시간 범위 내 + 유사도 임계값 이상인 그룹 반환
create or replace function public.find_similar_group(
  p_title_normalized text,
  p_category text,
  p_similarity_threshold float default 0.6,
  p_hours_range integer default 48
)
returns table(group_id uuid, similarity float)
language sql
security definer
as $$
  select
    a.group_id,
    similarity(a.title_normalized, p_title_normalized)::float as similarity
  from public.news_articles a
  where a.group_id is not null
    and a.category = p_category
    and a.created_at >= now() - make_interval(hours => p_hours_range)
    and similarity(a.title_normalized, p_title_normalized) >= p_similarity_threshold
  order by similarity desc
  limit 1;
$$;

-- 그룹 기사 수 갱신 RPC (race condition 방지)
create or replace function public.increment_article_count(p_group_id uuid)
returns void
language sql
security definer
as $$
  update public.news_article_groups
  set article_count = (
    select count(*)::integer
    from public.news_articles
    where group_id = p_group_id
  )
  where id = p_group_id;
$$;

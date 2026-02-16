import { cacheLife, cacheTag } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";

// --- 프론트엔드용 타입 정의 ---

/** 뉴스 그룹 내 개별 기사 (원문 링크 표시용) */
export interface GroupArticle {
  id: string;
  title: string;
  original_url: string;
  source: { name: string } | null;
}

/** 대표 기사 정보 */
export interface RepresentativeArticle {
  id: string;
  title: string;
  description: string | null;
  original_url: string;
  image_url: string | null;
  published_at: string | null;
  source: { name: string } | null;
}

/** 뉴스 그룹 + 대표 기사 + 그룹 내 기사 목록 */
export interface NewsGroupWithArticles {
  id: string;
  category: string;
  article_count: number;
  fact_summary: string | null;
  is_summarized: boolean;
  created_at: string;
  representative_article: RepresentativeArticle | null;
  articles: GroupArticle[];
}

/** 뉴스 그룹 목록 조회 결과 */
export interface NewsGroupsResult {
  groups: NewsGroupWithArticles[];
  count: number;
}

// --- 조인 쿼리 상수 ---

/** 그룹 조회 셀렉트 (articles embedded join 제거 — RPC로 대체) */
const NEWS_GROUP_SELECT = `
  id,
  category,
  article_count,
  fact_summary,
  is_summarized,
  created_at,
  representative_article:news_articles!fk_representative_article (
    id,
    title,
    description,
    original_url,
    image_url,
    published_at,
    source:news_sources (name)
  )
`;

/** 그룹 조회 결과 (articles 제외) */
type NewsGroupRaw = Omit<NewsGroupWithArticles, "articles">;

/** RPC 반환 행 타입 */
interface TopArticleRow {
  group_id: string;
  id: string;
  title: string;
  original_url: string;
  source_name: string | null;
}

/** RPC 결과를 GroupArticle[]로 변환하여 그룹에 매핑 */
function attachArticlesToGroups(
  groups: NewsGroupRaw[],
  rows: TopArticleRow[],
): NewsGroupWithArticles[] {
  const map = new Map<string, GroupArticle[]>();
  for (const row of rows) {
    const arr = map.get(row.group_id) ?? [];
    arr.push({
      id: row.id,
      title: row.title,
      original_url: row.original_url,
      source: row.source_name ? { name: row.source_name } : null,
    });
    map.set(row.group_id, arr);
  }
  return groups.map((g) => ({ ...g, articles: map.get(g.id) ?? [] }));
}

// --- 데이터 페칭 함수 ---

/**
 * 뉴스 그룹 목록을 조회한다.
 * 카테고리 필터, 페이지네이션 지원.
 * use cache로 캐싱 — 수집 API에서 updateTag('news-groups')로 무효화.
 */
export async function getNewsGroups(options?: {
  category?: string;
  limit?: number;
  offset?: number;
}): Promise<NewsGroupsResult> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 3600, expire: 86400 });
  cacheTag("news-groups");

  const { category, limit = 20, offset = 0 } = options ?? {};

  // use cache는 쿠키 의존성을 가질 수 없으므로 adminClient 사용 (뉴스 데이터는 공개)
  const supabase = createAdminClient();

  // 1) 그룹 조회 (articles embedded join 없이)
  let query = supabase
    .from("news_article_groups")
    .select(NEWS_GROUP_SELECT, { count: "exact" })
    .eq("is_valid", true);

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  query = query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query.returns<NewsGroupRaw[]>();

  if (error) {
    console.error("뉴스 그룹 조회 실패:", error.message);
    return { groups: [], count: 0 };
  }

  const rawGroups = data ?? [];
  if (rawGroups.length === 0) {
    return { groups: [], count: count ?? 0 };
  }

  // 2) RPC로 그룹별 상위 기사 조회
  const groupIds = rawGroups.map((g) => g.id);
  const { data: articleRows, error: rpcError } = await supabase.rpc(
    "get_top_articles_for_groups",
    { p_group_ids: groupIds, p_limit_per_group: 4 },
  );

  if (rpcError) {
    console.error("그룹 기사 RPC 조회 실패:", rpcError.message);
    // RPC 실패 시 articles 빈 배열로 폴백
    return {
      groups: rawGroups.map((g) => ({ ...g, articles: [] })),
      count: count ?? 0,
    };
  }

  // 3) 그룹에 기사 매핑
  return {
    groups: attachArticlesToGroups(rawGroups, articleRows ?? []),
    count: count ?? 0,
  };
}

/**
 * 대시보드용 최신 뉴스 그룹을 조회한다.
 */
export async function getLatestNewsGroups(
  limit: number = 6,
): Promise<NewsGroupWithArticles[]> {
  const { groups } = await getNewsGroups({ limit });
  return groups;
}

/**
 * 특정 그룹 내 기사 목록을 조회한다.
 * use cache로 캐싱 — 수집 API에서 updateTag('news-group-articles')로 무효화.
 */
export async function getNewsGroupArticles(groupId: string) {
  "use cache";
  cacheLife({ stale: 300, revalidate: 3600, expire: 86400 });
  cacheTag("news-group-articles");

  // use cache는 쿠키 의존성을 가질 수 없으므로 adminClient 사용 (뉴스 데이터는 공개)
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("news_articles")
    .select(
      `
      id,
      title,
      description,
      original_url,
      author,
      published_at,
      image_url,
      source:news_sources (name)
    `,
    )
    .eq("group_id", groupId)
    .order("published_at", { ascending: true });

  if (error) {
    console.error("그룹 기사 조회 실패:", error.message);
    return [];
  }

  return data ?? [];
}

/**
 * 뉴스 그룹 상세 정보를 조회한다 (상세 페이지용).
 * use cache로 캐싱 — 수집 API에서 updateTag('news-groups')로 무효화.
 */
export async function getNewsGroupDetail(groupId: string) {
  "use cache";
  cacheLife({ stale: 300, revalidate: 3600, expire: 86400 });
  cacheTag("news-groups");

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("news_article_groups")
    .select(NEWS_GROUP_SELECT)
    .eq("id", groupId)
    .eq("is_valid", true)
    .maybeSingle();

  if (error) {
    console.error("뉴스 그룹 상세 조회 실패:", error.message);
    return null;
  }

  return data as NewsGroupRaw | null;
}

/**
 * 특정 그룹의 관련 기사 목록을 조회한다 (상세 페이지용, 최신순).
 * use cache로 캐싱 — 수집 API에서 updateTag('news-group-articles')로 무효화.
 */
export async function getRelatedArticles(groupId: string) {
  "use cache";
  cacheLife({ stale: 300, revalidate: 3600, expire: 86400 });
  cacheTag("news-group-articles");

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("news_articles")
    .select(
      `
      id,
      title,
      original_url,
      published_at,
      source:news_sources (name)
    `,
    )
    .eq("group_id", groupId)
    .order("published_at", { ascending: false });

  if (error) {
    console.error("관련 기사 조회 실패:", error.message);
    return [];
  }

  return data ?? [];
}

import { createClient } from "@/lib/supabase/server";

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
  ),
  articles:news_articles!news_articles_group_id_fkey (
    id,
    title,
    original_url,
    source:news_sources (name)
  )
`;

// --- 데이터 페칭 함수 ---

/**
 * 뉴스 그룹 목록을 조회한다.
 * 카테고리 필터, 페이지네이션 지원. Phase 4에서 페이지네이션 UI 추가 예정.
 */
export async function getNewsGroups(options?: {
  category?: string;
  limit?: number;
  offset?: number;
}): Promise<NewsGroupsResult> {
  const { category, limit = 20, offset = 0 } = options ?? {};

  const supabase = await createClient();

  let query = supabase
    .from("news_article_groups")
    .select(NEWS_GROUP_SELECT, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  // 카테고리 필터 적용
  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("뉴스 그룹 조회 실패:", error.message);
    return { groups: [], count: 0 };
  }

  return {
    groups: (data ?? []) as unknown as NewsGroupWithArticles[],
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
 */
export async function getNewsGroupArticles(groupId: string) {
  const supabase = await createClient();

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

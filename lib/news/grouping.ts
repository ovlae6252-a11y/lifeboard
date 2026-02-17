import { createAdminClient } from "@/lib/supabase/admin";
import type { ArticleInsert, GroupingResult } from "./types";

// 그룹핑 설정
const SIMILARITY_THRESHOLD = 0.4;
const HOURS_RANGE = 96;
const BATCH_SIZE = 50;

// 기사 그룹핑: 유사 제목 기사를 같은 그룹으로 묶음
// DB PL/pgSQL 함수로 일괄 처리하여 네트워크 왕복을 N번에서 2번으로 대폭 감소
export async function groupArticles(
  articles: ArticleInsert[],
): Promise<GroupingResult[]> {
  if (articles.length === 0) return [];

  const supabase = createAdminClient();

  // 1. 기사 ID 일괄 조회 (guid → id 매핑)
  const guids = articles.map((a) => a.guid);
  const articleIdMap = new Map<string, string>();

  for (let i = 0; i < guids.length; i += BATCH_SIZE) {
    const batch = guids.slice(i, i + BATCH_SIZE);
    const { data: fetched, error: fetchError } = await supabase
      .from("news_articles")
      .select("id, guid")
      .in("guid", batch);

    if (fetchError) {
      console.error("[그룹핑] 기사 일괄 조회 실패:", fetchError.message);
    }
    (fetched ?? []).forEach((a) => articleIdMap.set(a.guid, a.id));
  }

  // 2. RPC용 JSONB 배열 구성
  const rpcArticles = articles
    .map((a) => {
      const id = articleIdMap.get(a.guid);
      if (!id) {
        console.warn(`[그룹핑] 기사 ID 미발견 (guid: ${a.guid})`);
        return null;
      }
      return {
        article_id: id,
        title_normalized: a.title_normalized,
        category: a.category,
      };
    })
    .filter((a) => a !== null);

  if (rpcArticles.length === 0) return [];

  // 3. 배치 그룹핑 RPC 호출 (단일 트랜잭션)
  const { data, error } = await supabase.rpc("batch_group_articles", {
    p_articles: rpcArticles,
    p_similarity_threshold: SIMILARITY_THRESHOLD,
    p_hours_range: HOURS_RANGE,
  });

  if (error) {
    console.error("[그룹핑] 배치 그룹핑 RPC 실패:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    article_id: row.article_id,
    group_id: row.group_id,
    is_new_group: row.is_new_group,
  }));
}

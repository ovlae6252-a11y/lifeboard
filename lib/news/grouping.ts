import { createAdminClient } from "@/lib/supabase/admin";
import type { ArticleInsert, GroupingResult } from "./types";

// 그룹핑 설정
const SIMILARITY_THRESHOLD = 0.6;
const HOURS_RANGE = 48;

// 기사 그룹핑: 유사 제목 기사를 같은 그룹으로 묶음
// 순차 처리로 동시성 문제 방지
export async function groupArticles(
  articles: ArticleInsert[],
): Promise<GroupingResult[]> {
  if (articles.length === 0) return [];

  const supabase = createAdminClient();
  const results: GroupingResult[] = [];

  for (const article of articles) {
    try {
      // 1. 기사 ID 조회 (이미 INSERT된 상태)
      const { data: existingArticle, error: fetchError } = await supabase
        .from("news_articles")
        .select("id")
        .eq("source_id", article.source_id)
        .eq("guid", article.guid)
        .single();

      if (fetchError || !existingArticle) {
        console.warn(`[그룹핑] 기사 조회 실패 (guid: ${article.guid}):`, fetchError?.message);
        continue;
      }

      const articleId = existingArticle.id;

      // 2. 유사 그룹 검색
      const { data: similarGroup, error: rpcError } = await supabase.rpc(
        "find_similar_group",
        {
          p_title_normalized: article.title_normalized,
          p_category: article.category,
          p_similarity_threshold: SIMILARITY_THRESHOLD,
          p_hours_range: HOURS_RANGE,
        },
      );

      if (rpcError) {
        console.error(`[그룹핑] 유사 그룹 검색 실패 (기사 ${articleId}):`, rpcError.message);
        // 에러 시 새 그룹 생성으로 폴백
      }

      if (!rpcError && similarGroup && similarGroup.length > 0) {
        // 유사 그룹 존재 → 기존 그룹에 추가
        const groupId = similarGroup[0].group_id;

        await supabase
          .from("news_articles")
          .update({ group_id: groupId })
          .eq("id", articleId);

        await supabase.rpc("increment_article_count", {
          p_group_id: groupId,
        });

        results.push({ article_id: articleId, group_id: groupId, is_new_group: false });
      } else {
        // 유사 그룹 없음 또는 RPC 실패 → 새 그룹 생성
        const { data: newGroup, error: groupError } = await supabase
          .from("news_article_groups")
          .insert({
            category: article.category,
            article_count: 1,
            representative_article_id: articleId,
          })
          .select("id")
          .single();

        if (groupError || !newGroup) {
          console.error(`[그룹핑] 그룹 생성 실패 (기사 ${articleId}):`, groupError?.message);
          continue;
        }

        await supabase
          .from("news_articles")
          .update({ group_id: newGroup.id })
          .eq("id", articleId);

        results.push({ article_id: articleId, group_id: newGroup.id, is_new_group: true });
      }
    } catch (error) {
      console.error(`[그룹핑] 예외 발생 (guid: ${article.guid}):`, error);
      continue;
    }
  }

  return results;
}

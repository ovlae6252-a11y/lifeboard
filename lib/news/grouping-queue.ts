import { createAdminClient } from "@/lib/supabase/admin";

// 새 기사 배치에 대해 LLM 그룹핑 작업 큐에 등록
// Ollama 워커가 비동기로 처리하여 같은 사건 기사들을 의미 기반으로 병합
export async function enqueueGroupingJob(articleIds: string[]): Promise<void> {
  if (articleIds.length < 2) return;

  const supabase = createAdminClient();

  const { error } = await supabase.from("grouping_jobs").insert({
    status: "pending",
    article_ids: articleIds,
  });

  if (error) {
    // collect 플로우를 중단하지 않기 위해 throw 금지
    console.error("[그룹핑 큐] 작업 등록 실패:", error.message);
  }
}

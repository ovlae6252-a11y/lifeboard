import { createAdminClient } from "@/lib/supabase/admin";
import type { FetchResult } from "./types";

// 수집 결과를 news_fetch_logs에 기록
export async function logFetchResult(result: FetchResult): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase.from("news_fetch_logs").insert({
    source_id: result.source_id,
    status: result.status,
    articles_fetched: result.articles_fetched,
    articles_new: result.articles_new,
    error_message: result.error_message ?? null,
  });

  if (error) {
    console.error("[수집 로그] 기록 실패:", error.message);
  }
}

// 소스의 last_fetched_at 갱신
export async function updateLastFetchedAt(sourceId: string): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("news_sources")
    .update({ last_fetched_at: new Date().toISOString() })
    .eq("id", sourceId);

  if (error) {
    console.error("[수집 로그] last_fetched_at 갱신 실패:", error.message);
  }
}

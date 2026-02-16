import { createAdminClient } from "@/lib/supabase/admin";

interface CleanupResult {
  logs_deleted: number;
  jobs_deleted: number;
}

// 오래된 로그/작업 데이터 정리
// news_fetch_logs: 90일 이전, summarize_jobs: 30일 이전 completed/failed 삭제
export async function cleanupOldRecords(): Promise<void> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("cleanup_old_records");

  if (error) {
    console.error("[데이터 정리] 실패:", error.message);
    return;
  }

  const result = data as CleanupResult | null;

  if (result && (result.logs_deleted > 0 || result.jobs_deleted > 0)) {
    console.log(
      `[데이터 정리] 수집 로그 ${result.logs_deleted}건, 요약 작업 ${result.jobs_deleted}건 삭제`,
    );
  }
}

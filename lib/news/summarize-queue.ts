import { createAdminClient } from "@/lib/supabase/admin";

// 새 그룹에 대해 요약 작업 큐에 일괄 등록
// DB RPC 함수로 INSERT ... ON CONFLICT DO NOTHING 패턴 적용
// partial unique index(idx_summarize_jobs_active_per_group)가 중복 방지
export async function enqueueSummarizeJobs(
  groupIds: string[],
): Promise<number> {
  if (groupIds.length === 0) return 0;

  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("enqueue_summarize_jobs", {
    p_group_ids: groupIds,
  });

  if (error) {
    console.error("[요약 큐] 일괄 등록 실패:", error.message);
    return 0;
  }

  return data ?? 0;
}

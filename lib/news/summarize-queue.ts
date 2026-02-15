import { createAdminClient } from "@/lib/supabase/admin";

// 새 그룹에 대해 요약 작업 큐에 등록
// pending/processing 중인 작업이 있으면 중복 등록하지 않음
export async function enqueueSummarizeJobs(
  groupIds: string[],
): Promise<number> {
  if (groupIds.length === 0) return 0;

  const supabase = createAdminClient();
  let enqueued = 0;

  for (const groupId of groupIds) {
    // INSERT 먼저 시도 — partial unique index가 중복 방지
    const { error } = await supabase.from("summarize_jobs").insert({
      group_id: groupId,
      status: "pending",
      requested_by: "system",
    });

    if (!error) {
      enqueued++;
    } else if (error.code !== "23505") {
      // unique constraint violation이 아닌 실제 에러만 로깅
      console.error("[요약 큐] 작업 등록 실패:", error.message);
    }
  }

  return enqueued;
}

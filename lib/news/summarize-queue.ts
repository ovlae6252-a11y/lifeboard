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
    // 이미 pending/processing 중인 작업이 있는지 확인
    const { data: existing } = await supabase
      .from("summarize_jobs")
      .select("id")
      .eq("group_id", groupId)
      .in("status", ["pending", "processing"])
      .limit(1);

    if (existing && existing.length > 0) continue;

    const { error } = await supabase.from("summarize_jobs").insert({
      group_id: groupId,
      status: "pending",
      requested_by: "system",
    });

    if (!error) enqueued++;
  }

  return enqueued;
}

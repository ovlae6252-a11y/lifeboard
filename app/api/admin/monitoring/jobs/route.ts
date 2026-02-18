import { NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSummarizeJobs } from "@/lib/admin/queries";

function errorResponse(error: unknown, defaultStatus: number = 500) {
  if (error instanceof Error && error.message === "관리자 권한이 필요합니다") {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }
  const message =
    process.env.NODE_ENV === "development" && error instanceof Error
      ? error.message
      : "서버 오류가 발생했습니다";
  return NextResponse.json({ error: message }, { status: defaultStatus });
}

/** GET: 요약 작업 조회 (필터 + 페이지네이션) */
export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit") ?? 20)),
    );
    const status = searchParams.get("status") ?? undefined;

    const result = await getSummarizeJobs({ status, page, limit });

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

/** PUT: 요약 작업 재시도 또는 리셋 */
export async function PUT(request: Request) {
  try {
    const { adminId } = await requireAdmin();
    const body = await request.json();
    const { action, jobId } = body as {
      action: "retry" | "reset";
      jobId: string;
    };

    if (!action || !jobId) {
      return NextResponse.json(
        { error: "action과 jobId가 필요합니다" },
        { status: 400 },
      );
    }

    if (action !== "retry" && action !== "reset") {
      return NextResponse.json(
        { error: "action은 retry 또는 reset이어야 합니다" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    if (action === "retry") {
      // failed 작업을 pending으로 변경
      const { data: job, error: fetchError } = await admin
        .from("summarize_jobs")
        .select("id, status, group_id")
        .eq("id", jobId)
        .single();

      if (fetchError || !job) {
        return NextResponse.json(
          { error: "작업을 찾을 수 없습니다" },
          { status: 404 },
        );
      }

      if (job.status !== "failed") {
        return NextResponse.json(
          { error: "failed 상태의 작업만 재시도할 수 있습니다" },
          { status: 400 },
        );
      }

      const { error } = await admin
        .from("summarize_jobs")
        .update({
          status: "pending",
          error_message: null,
          started_at: null,
          completed_at: null,
        })
        .eq("id", jobId);

      if (error) throw error;

      await logAdminAction({
        adminId,
        action: "job_retry",
        targetType: "summarize_job",
        targetId: jobId,
      });
    } else if (action === "reset") {
      // processing 상태이고 1시간 이상 경과한 작업을 pending으로 리셋
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      const { data: job, error: fetchError } = await admin
        .from("summarize_jobs")
        .select("id, status, started_at, group_id")
        .eq("id", jobId)
        .single();

      if (fetchError || !job) {
        return NextResponse.json(
          { error: "작업을 찾을 수 없습니다" },
          { status: 404 },
        );
      }

      if (job.status !== "processing") {
        return NextResponse.json(
          { error: "processing 상태의 작업만 리셋할 수 있습니다" },
          { status: 400 },
        );
      }

      if (job.started_at && job.started_at > oneHourAgo) {
        return NextResponse.json(
          { error: "1시간 이상 경과한 작업만 리셋할 수 있습니다" },
          { status: 400 },
        );
      }

      const { error } = await admin
        .from("summarize_jobs")
        .update({
          status: "pending",
          error_message: null,
          started_at: null,
          completed_at: null,
        })
        .eq("id", jobId);

      if (error) throw error;

      await logAdminAction({
        adminId,
        action: "job_reset",
        targetType: "summarize_job",
        targetId: jobId,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

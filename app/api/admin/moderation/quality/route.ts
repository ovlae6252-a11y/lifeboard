import { NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

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

/** GET: 품질 검증 실패(is_valid=false) 뉴스 그룹 목록 */
export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = 20;
    const offset = (page - 1) * limit;

    const admin = createAdminClient();

    const [{ data, error }, { count, error: countError }] = await Promise.all([
      admin
        .from("news_article_groups")
        .select(
          "id, fact_summary, created_at, news_articles!fk_representative_article(title)",
        )
        .eq("is_valid", false)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1),
      admin
        .from("news_article_groups")
        .select("*", { count: "exact", head: true })
        .eq("is_valid", false),
    ]);

    if (error) throw error;
    if (countError) throw countError;

    return NextResponse.json({ groups: data, total: count ?? 0, page, limit });
  } catch (error) {
    return errorResponse(error);
  }
}

/** PUT: 그룹 승인/거절 */
export async function PUT(request: Request) {
  try {
    const { adminId } = await requireAdmin();
    const body = await request.json();
    const { id, action } = body as {
      id: string;
      action: "approve" | "reject";
    };

    if (!id || !action) {
      return NextResponse.json(
        { error: "id와 action이 필요합니다" },
        { status: 400 },
      );
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: "action은 approve 또는 reject여야 합니다" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    if (action === "approve") {
      const { error } = await admin
        .from("news_article_groups")
        .update({ is_valid: true })
        .eq("id", id);
      if (error) throw error;
    }
    // reject: is_valid=false 상태를 그대로 유지 (DB 변경 없음, 감사 로그만 기록)

    await logAdminAction({
      adminId,
      action: `quality_${action}`,
      targetType: "news_article_group",
      targetId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

/** POST: 요약 재실행 */
export async function POST(request: Request) {
  try {
    const { adminId } = await requireAdmin();
    const body = await request.json();
    const { action, groupIds } = body as {
      action: "rerun";
      groupIds: string[];
    };

    if (
      action !== "rerun" ||
      !Array.isArray(groupIds) ||
      groupIds.length === 0
    ) {
      return NextResponse.json(
        { error: "action: rerun과 groupIds 배열이 필요합니다" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    // 각 그룹에 대해 새 pending 작업 INSERT (배치)
    const jobs = groupIds.map((groupId) => ({
      group_id: groupId,
      status: "pending" as const,
    }));

    const { error } = await admin.from("summarize_jobs").insert(jobs);

    if (error) {
      // 이미 pending/processing 상태인 그룹이 포함된 경우 (unique constraint 위반)
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "이미 요약 작업이 예약된 그룹이 포함되어 있습니다" },
          { status: 409 },
        );
      }
      throw error;
    }

    await logAdminAction({
      adminId,
      action: "quality_rerun",
      targetType: "news_article_group",
      details: { groupIds, count: groupIds.length },
    });

    return NextResponse.json({ success: true, queued: groupIds.length });
  } catch (error) {
    return errorResponse(error);
  }
}

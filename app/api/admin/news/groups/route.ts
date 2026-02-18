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

/** GET: 그룹 목록 (필터: category, is_valid, page, limit) */
export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const isValid = searchParams.get("is_valid");
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);
    const offset = (page - 1) * limit;

    const admin = createAdminClient();
    let query = admin
      .from("news_article_groups")
      .select(
        `id, category, is_valid, article_count, fact_summary,
         representative_article_id, created_at,
         news_articles!fk_representative_article(title, published_at)`,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) query = query.eq("category", category);
    if (isValid !== null) query = query.eq("is_valid", isValid === "true");

    const { data, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({ groups: data, total: count ?? 0, page, limit });
  } catch (error) {
    return errorResponse(error);
  }
}

/** PUT: 그룹 is_valid 토글 또는 기타 업데이트 */
export async function PUT(request: Request) {
  try {
    const { adminId } = await requireAdmin();
    const body = await request.json();
    const { id, is_valid } = body as { id: string; is_valid: boolean };

    if (!id || is_valid === undefined) {
      return NextResponse.json(
        { error: "id, is_valid가 필요합니다" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("news_article_groups")
      .update({ is_valid })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await logAdminAction({
      adminId,
      action: is_valid ? "group_show" : "group_hide",
      targetType: "news_group",
      targetId: id,
      details: { is_valid },
    });

    return NextResponse.json({ group: data });
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
      action: string;
      groupIds: string[];
    };

    if (
      action !== "rerun_summary" ||
      !Array.isArray(groupIds) ||
      groupIds.length === 0
    ) {
      return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });
    }

    const admin = createAdminClient();

    // 기존 pending/processing 작업 완료 표시 후 재등록
    const { error: updateError } = await admin
      .from("summarize_jobs")
      .update({
        status: "failed",
        error_message: "관리자 재실행 요청으로 취소됨",
      })
      .in("group_id", groupIds)
      .in("status", ["pending", "processing"]);

    if (updateError) throw updateError;

    const jobs = groupIds.map((group_id) => ({ group_id, status: "pending" }));
    const { error: insertError } = await admin
      .from("summarize_jobs")
      .insert(jobs);

    if (insertError) throw insertError;

    await logAdminAction({
      adminId,
      action: "group_rerun_summary",
      targetType: "news_group",
      details: { groupIds, count: groupIds.length },
    });

    return NextResponse.json({ success: true, count: groupIds.length });
  } catch (error) {
    return errorResponse(error);
  }
}

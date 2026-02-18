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

/** GET: 기사 검색 (q, sourceId, dateFrom, dateTo, page, limit) */
export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const sourceId = searchParams.get("sourceId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);
    const offset = (page - 1) * limit;

    const admin = createAdminClient();
    let query = admin
      .from("news_articles")
      .select(
        "id, title, original_url, source_id, group_id, published_at, is_deleted, created_at",
        { count: "exact" },
      )
      .order("published_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (q) query = query.ilike("title", `%${q}%`);
    if (sourceId) query = query.eq("source_id", sourceId);
    if (dateFrom) query = query.gte("published_at", dateFrom);
    if (dateTo) query = query.lte("published_at", dateTo);

    const { data, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      articles: data,
      total: count ?? 0,
      page,
      limit,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

/** DELETE: 기사 soft delete */
export async function DELETE(request: Request) {
  try {
    const { adminId } = await requireAdmin();
    const body = await request.json();
    const { id } = body as { id: string };

    if (!id) {
      return NextResponse.json({ error: "id가 필요합니다" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("news_articles")
      .update({ is_deleted: true })
      .eq("id", id);

    if (error) throw error;

    await logAdminAction({
      adminId,
      action: "article_delete",
      targetType: "news_article",
      targetId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

/** PUT: 기사 그룹 변경 */
export async function PUT(request: Request) {
  try {
    const { adminId } = await requireAdmin();
    const body = await request.json();
    const { id, group_id } = body as { id: string; group_id: string };

    if (!id || !group_id) {
      return NextResponse.json(
        { error: "id, group_id가 필요합니다" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("news_articles")
      .update({ group_id })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await logAdminAction({
      adminId,
      action: "article_regroup",
      targetType: "news_article",
      targetId: id,
      details: { group_id },
    });

    return NextResponse.json({ article: data });
  } catch (error) {
    return errorResponse(error);
  }
}

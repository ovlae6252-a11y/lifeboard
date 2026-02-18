import { NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";

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

/** GET: 뉴스 소스 목록 + 마지막 수집 시간 */
export async function GET() {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("news_sources")
      .select("id, name, feed_url, category, is_active, created_at")
      .order("name");

    if (error) throw error;
    return NextResponse.json({ sources: data });
  } catch (error) {
    return errorResponse(error);
  }
}

/** POST: 소스 추가 */
export async function POST(request: Request) {
  try {
    const { adminId } = await requireAdmin();
    const body = await request.json();
    const { name, feed_url, category } = body as {
      name: string;
      feed_url: string;
      category: string;
    };

    if (!name || !feed_url || !category) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("news_sources")
      .insert({ name, feed_url, category })
      .select()
      .single();

    if (error) throw error;

    await logAdminAction({
      adminId,
      action: "source_create",
      targetType: "news_source",
      targetId: data.id,
      details: { name, feed_url, category },
    });

    return NextResponse.json({ source: data }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

/** PUT: 소스 편집 (is_active / name / category) */
export async function PUT(request: Request) {
  try {
    const { adminId } = await requireAdmin();
    const body = await request.json();
    const { id, ...updates } = body as {
      id: string;
      is_active?: boolean;
      name?: string;
      category?: string;
    };

    if (!id) {
      return NextResponse.json({ error: "id가 필요합니다" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("news_sources")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await logAdminAction({
      adminId,
      action: "source_update",
      targetType: "news_source",
      targetId: id,
      details: updates as Json,
    });

    return NextResponse.json({ source: data });
  } catch (error) {
    return errorResponse(error);
  }
}

/** DELETE: 소스 삭제 (?id=) */
export async function DELETE(request: Request) {
  try {
    const { adminId } = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id가 필요합니다" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin.from("news_sources").delete().eq("id", id);

    if (error) throw error;

    await logAdminAction({
      adminId,
      action: "source_delete",
      targetType: "news_source",
      targetId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

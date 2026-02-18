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

/** GET: 콘텐츠 필터 목록 조회 */
export async function GET() {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("content_filters")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ filters: data });
  } catch (error) {
    return errorResponse(error);
  }
}

/** POST: 필터 추가 */
export async function POST(request: Request) {
  try {
    const { adminId } = await requireAdmin();
    const body = await request.json();
    const { filter_type, keywords, is_active } = body as {
      filter_type: string;
      keywords: string[];
      is_active?: boolean;
    };

    if (!filter_type || !keywords || !Array.isArray(keywords)) {
      return NextResponse.json(
        { error: "filter_type과 keywords 배열이 필요합니다" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("content_filters")
      .insert({ filter_type, keywords, is_active: is_active ?? true })
      .select()
      .single();

    if (error) throw error;

    await logAdminAction({
      adminId,
      action: "filter_create",
      targetType: "content_filter",
      targetId: data.id,
      details: { filter_type, keywords } as Json,
    });

    return NextResponse.json({ filter: data }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

/** PUT: 필터 수정 */
export async function PUT(request: Request) {
  try {
    const { adminId } = await requireAdmin();
    const body = await request.json();
    const { id, ...updates } = body as {
      id: string;
      keywords?: string[];
      is_active?: boolean;
    };

    if (!id) {
      return NextResponse.json({ error: "id가 필요합니다" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("content_filters")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await logAdminAction({
      adminId,
      action: "filter_update",
      targetType: "content_filter",
      targetId: id,
      details: updates as Json,
    });

    return NextResponse.json({ filter: data });
  } catch (error) {
    return errorResponse(error);
  }
}

/** DELETE: 필터 삭제 (?id=) */
export async function DELETE(request: Request) {
  try {
    const { adminId } = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id가 필요합니다" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin.from("content_filters").delete().eq("id", id);

    if (error) throw error;

    await logAdminAction({
      adminId,
      action: "filter_delete",
      targetType: "content_filter",
      targetId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

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

/** PUT: 사용자 역할 변경 또는 계정 정지/해제 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { adminId } = await requireAdmin();
    const { userId } = await params;
    const body = await request.json();
    const { action } = body as { action: "role" | "ban" };

    if (!action) {
      return NextResponse.json(
        { error: "action이 필요합니다" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    if (action === "role") {
      const { role } = body as { action: "role"; role: "admin" | "user" };

      // 자기 자신 역할 변경 금지
      if (adminId === userId) {
        return NextResponse.json(
          { error: "자신의 역할은 변경할 수 없습니다" },
          { status: 400 },
        );
      }

      if (role !== "admin" && role !== "user") {
        return NextResponse.json(
          { error: "role은 admin 또는 user여야 합니다" },
          { status: 400 },
        );
      }

      const { error } = await admin.auth.admin.updateUserById(userId, {
        app_metadata: { role },
      });
      if (error) throw error;

      await logAdminAction({
        adminId,
        action: "user_role_change",
        targetType: "user",
        targetId: userId,
        details: { role } as Json,
      });
    } else if (action === "ban") {
      // 자기 자신 계정 정지 금지
      if (adminId === userId) {
        return NextResponse.json(
          { error: "자신의 계정은 정지할 수 없습니다" },
          { status: 400 },
        );
      }

      const { banned } = body as { action: "ban"; banned: boolean };

      const { error } = await admin.auth.admin.updateUserById(userId, {
        ban_duration: banned ? "87600h" : "none",
      });
      if (error) throw error;

      await logAdminAction({
        adminId,
        action: banned ? "user_ban" : "user_unban",
        targetType: "user",
        targetId: userId,
      });
    } else {
      return NextResponse.json(
        { error: "action은 role 또는 ban이어야 합니다" },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

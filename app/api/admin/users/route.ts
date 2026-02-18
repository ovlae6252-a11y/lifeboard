import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { User } from "@supabase/supabase-js";

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

function transformUser(user: User) {
  const isBanned = user.banned_until
    ? new Date(user.banned_until) > new Date()
    : false;

  return {
    id: user.id,
    email: user.email ?? "",
    displayName:
      (user.user_metadata?.full_name as string) ??
      (user.user_metadata?.name as string) ??
      (user.user_metadata?.display_name as string) ??
      "",
    role: (user.app_metadata?.role as string) ?? "user",
    provider: (user.app_metadata?.provider as string) ?? "email",
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at ?? null,
    isBanned,
  };
}

/** GET: 사용자 목록 조회 (페이지네이션 + 이메일 검색) */
export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const perPage = Math.min(
      100,
      Math.max(1, Number(searchParams.get("perPage") ?? 20)),
    );
    const emailFilter = searchParams.get("email")?.toLowerCase() ?? "";

    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });

    if (error) throw error;

    const users = emailFilter
      ? data.users.filter((u) => u.email?.toLowerCase().includes(emailFilter))
      : data.users;

    return NextResponse.json({
      users: users.map(transformUser),
      // 이메일 필터 적용 시 필터링된 결과 수를, 아닐 때는 전체 사용자 수를 반환
      total: emailFilter ? users.length : (data.total ?? 0),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

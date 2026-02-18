import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { getSystemStatus } from "@/lib/admin/queries";

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

/** GET: 시스템 상태 조회 */
export async function GET() {
  try {
    await requireAdmin();
    const status = await getSystemStatus();
    return NextResponse.json(status);
  } catch (error) {
    return errorResponse(error);
  }
}

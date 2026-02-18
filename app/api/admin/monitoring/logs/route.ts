import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { getFetchLogs } from "@/lib/admin/queries";

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

/** GET: 수집 로그 조회 (필터 + 페이지네이션) */
export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit") ?? 20)),
    );
    const sourceId = searchParams.get("sourceId") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const dateFrom = searchParams.get("dateFrom") ?? undefined;
    const dateTo = searchParams.get("dateTo") ?? undefined;

    const result = await getFetchLogs({
      sourceId,
      status,
      dateFrom,
      dateTo,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

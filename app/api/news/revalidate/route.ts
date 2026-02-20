import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

// CRON_SECRET 검증 (수집 API와 동일한 인증 패턴)
function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || cronSecret.trim() === "") {
    console.error("CRON_SECRET 환경 변수가 설정되지 않았습니다.");
    return false;
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

// Ollama 워커가 요약 완료 후 호출하는 캐시 무효화 엔드포인트
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "인증되지 않은 요청입니다." },
      { status: 401 },
    );
  }

  revalidateTag("news-groups", "max");
  revalidateTag("news-group-articles", "max");

  return NextResponse.json({
    ok: true,
    revalidated: ["news-groups", "news-group-articles"],
  });
}

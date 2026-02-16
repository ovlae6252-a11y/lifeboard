import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/protected";

  // Open Redirect 방지: 순수 상대 경로만 허용 (///host, /\host 등 우회 차단)
  const safeNext =
    next.startsWith("/") && !next.match(/^\/[\\/]/) ? next : "/protected";

  if (code) {
    const supabase = await createClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      redirect(safeNext);
    } else {
      redirect(
        `/auth/error?error=${encodeURIComponent("인증에 실패했습니다")}`,
      );
    }
  }

  redirect(
    `/auth/error?error=${encodeURIComponent("유효하지 않은 인증 요청입니다")}`,
  );
}

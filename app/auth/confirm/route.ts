import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

const validOtpTypes: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const typeParam = searchParams.get("type");
  const next = searchParams.get("next") ?? "/";

  // Open Redirect 방지: 상대 경로만 허용
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  // OTP 타입 런타임 검증
  const type = validOtpTypes.includes(typeParam as EmailOtpType)
    ? (typeParam as EmailOtpType)
    : null;

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      redirect(safeNext);
    } else {
      redirect(`/auth/error?error=${encodeURIComponent(error.message)}`);
    }
  }

  redirect(`/auth/error?error=${encodeURIComponent("유효하지 않은 인증 요청입니다")}`);
}

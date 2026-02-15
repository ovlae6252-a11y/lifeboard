// Supabase 환경 변수 검증
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase 환경 변수가 설정되지 않았습니다. " +
        "NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY를 " +
        ".env.local 파일에 설정해주세요.",
    );
  }

  return { url, key };
}

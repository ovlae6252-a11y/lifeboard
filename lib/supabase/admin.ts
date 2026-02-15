import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

// service_role 키 환경변수 검증
function getServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY 환경 변수가 설정되지 않았습니다. " +
        ".env.local 파일에 설정해주세요.",
    );
  }
  return key;
}

// 서버 전용 service_role 클라이언트 (RLS 우회)
// API Route, Cron 작업 등에서 사용
export function createAdminClient() {
  const { url } = getSupabaseEnv();
  const serviceRoleKey = getServiceRoleKey();

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

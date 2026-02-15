import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
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
// 쿠키 의존성이 없으므로 모듈 레벨에서 캐싱하여 재사용
let _adminClient: ReturnType<typeof _create> | undefined;

function _create() {
  const { url } = getSupabaseEnv();
  const serviceRoleKey = getServiceRoleKey();

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createAdminClient() {
  if (!_adminClient) {
    _adminClient = _create();
  }
  return _adminClient;
}

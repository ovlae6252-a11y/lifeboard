import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

/**
 * 현재 사용자가 관리자인지 확인
 * app_metadata.role === 'admin' 여부 반환
 */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims?.app_metadata?.role === "admin";
}

/**
 * 관리자 권한 필수 검증
 * 관리자가 아닌 경우 에러 throw
 * @returns { adminId: string } 관리자 사용자 ID
 */
export async function requireAdmin(): Promise<{ adminId: string }> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims?.app_metadata?.role !== "admin") {
    throw new Error("관리자 권한이 필요합니다");
  }

  return { adminId: data.claims.sub };
}

/**
 * 관리자 작업 감사 로그 기록
 * 에러 발생 시 console.error만 출력 (throw 금지 - 주 작업을 중단시키면 안 됨)
 */
export async function logAdminAction({
  adminId,
  action,
  targetType,
  targetId,
  details,
}: {
  adminId: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: Json;
}): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("admin_audit_logs").insert({
    admin_id: adminId,
    action,
    target_type: targetType,
    target_id: targetId ?? null,
    details: details ?? null,
  });

  if (error) {
    console.error("감사 로그 기록 실패:", error.message);
  }
}

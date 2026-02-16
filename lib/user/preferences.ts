import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";

/** 사용자 설정 인터페이스 */
export interface UserPreferences {
  user_id: string;
  preferred_categories: string[];
  dashboard_config: Record<string, unknown>;
  weather_location: string;
  email_digest_enabled: boolean;
  updated_at: string;
}

/** 기본 사용자 설정 */
export const DEFAULT_PREFERENCES: Omit<
  UserPreferences,
  "user_id" | "updated_at"
> = {
  preferred_categories: ["all"],
  dashboard_config: {},
  weather_location: "서울",
  email_digest_enabled: false,
};

/**
 * 사용자 설정을 조회합니다.
 * 설정이 없으면 기본값을 반환합니다.
 */
export async function getUserPreferences(
  userId: string,
): Promise<UserPreferences> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("사용자 설정 조회 실패:", error.message);
    // 기본값 반환
    return {
      user_id: userId,
      ...DEFAULT_PREFERENCES,
      updated_at: new Date().toISOString(),
    };
  }

  if (!data) {
    // 설정이 없으면 기본값 반환
    return {
      user_id: userId,
      ...DEFAULT_PREFERENCES,
      updated_at: new Date().toISOString(),
    };
  }

  // DB 데이터를 UserPreferences 형식으로 변환
  return {
    user_id: data.user_id,
    preferred_categories: (data.preferred_categories as string[]) || [],
    dashboard_config: (data.dashboard_config as Record<string, unknown>) || {},
    weather_location: data.weather_location,
    email_digest_enabled: data.email_digest_enabled,
    updated_at: data.updated_at,
  };
}

/**
 * 사용자 설정을 업데이트합니다.
 * 설정이 없으면 새로 생성합니다.
 */
export async function updateUserPreferences(
  userId: string,
  updates: Partial<Omit<UserPreferences, "user_id" | "updated_at">>,
): Promise<UserPreferences> {
  const supabase = createAdminClient();

  const updateData = {
    user_id: userId,
    preferred_categories: updates.preferred_categories as Json,
    dashboard_config: updates.dashboard_config as Json,
    weather_location: updates.weather_location,
    email_digest_enabled: updates.email_digest_enabled,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("user_preferences")
    .upsert(updateData, { onConflict: "user_id" })
    .select()
    .single();

  if (error) {
    console.error("사용자 설정 업데이트 실패:", error.message);
    throw new Error("설정 업데이트에 실패했습니다");
  }

  // DB 데이터를 UserPreferences 형식으로 변환
  return {
    user_id: data.user_id,
    preferred_categories: (data.preferred_categories as string[]) || [],
    dashboard_config: (data.dashboard_config as Record<string, unknown>) || {},
    weather_location: data.weather_location,
    email_digest_enabled: data.email_digest_enabled,
    updated_at: data.updated_at,
  };
}

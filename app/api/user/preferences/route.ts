import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  getUserPreferences,
  updateUserPreferences,
  type UserPreferences,
} from "@/lib/user/preferences";
import { LOCATION_NAMES } from "@/lib/weather/locations";

/**
 * GET /api/user/preferences
 * 현재 사용자의 설정 조회
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    // 사용자 설정 조회
    const preferences = await getUserPreferences(user.id);

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("설정 조회 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/user/preferences
 * 현재 사용자의 설정 업데이트
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    // 요청 본문 파싱
    const updates: Partial<Omit<UserPreferences, "user_id" | "updated_at">> =
      await request.json();

    // weather_location 화이트리스트 검증
    if (
      updates.weather_location !== undefined &&
      !LOCATION_NAMES.includes(updates.weather_location)
    ) {
      return NextResponse.json(
        { error: "유효하지 않은 위치입니다" },
        { status: 400 },
      );
    }

    // 사용자 설정 업데이트
    const preferences = await updateUserPreferences(user.id, updates);

    return NextResponse.json({ preferences, success: true });
  } catch (error) {
    console.error("설정 업데이트 오류:", error);

    const errorMessage =
      error instanceof Error ? error.message : "서버 오류가 발생했습니다";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

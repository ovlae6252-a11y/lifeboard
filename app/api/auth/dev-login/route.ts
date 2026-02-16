import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/auth/dev-login
 * 개발 전용 이메일/비밀번호 로그인
 * 테스트 사용자가 없으면 자동 생성
 */
export async function POST(request: NextRequest) {
  // 프로덕션에서는 비활성화 (VERCEL_ENV로 검증)
  if (process.env.VERCEL_ENV === "production") {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  // 추가 안전장치: NODE_ENV로도 검증
  if (
    process.env.NODE_ENV !== "development" &&
    process.env.ALLOW_DEV_LOGIN !== "true"
  ) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "이메일과 비밀번호를 입력하세요" },
        { status: 400 },
      );
    }

    // 1. 먼저 사용자가 존재하는지 확인 (admin client 사용)
    const adminClient = createAdminClient();
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users.find((u) => u.email === email);
    const userExists = !!existingUser;

    console.log(`[dev-login] 사용자 확인: ${email}, 존재: ${userExists}`);

    // 2. 사용자가 없으면 생성
    if (!userExists) {
      console.log(`[dev-login] 사용자 생성 중: ${email}`);
      const { data: newUser, error: createError } =
        await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            provider: "email",
            full_name: "Test User",
          },
        });

      if (createError) {
        console.error("테스트 사용자 생성 실패:", createError.message);
        return NextResponse.json(
          { error: "사용자 생성 실패: " + createError.message },
          { status: 500 },
        );
      }

      console.log(`[dev-login] 사용자 생성 성공: ${newUser?.user?.id}`);
    } else {
      console.log(`[dev-login] 기존 사용자 사용: ${existingUser.id}`);

      // 기존 사용자의 비밀번호 업데이트 (비밀번호가 다를 수 있으므로)
      console.log(`[dev-login] 비밀번호 업데이트 중...`);
      const { error: updateError } =
        await adminClient.auth.admin.updateUserById(existingUser.id, {
          password,
        });

      if (updateError) {
        console.error("비밀번호 업데이트 실패:", updateError.message);
      } else {
        console.log(`[dev-login] 비밀번호 업데이트 성공`);
      }
    }

    // 3. 일반 client로 로그인 (세션 생성)
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("로그인 실패:", error.message);
      return NextResponse.json(
        { error: "로그인 실패: " + error.message },
        { status: 401 },
      );
    }

    return NextResponse.json({
      success: true,
      user: data.user,
      message: "로그인 성공",
    });
  } catch (error) {
    console.error("개발 로그인 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}

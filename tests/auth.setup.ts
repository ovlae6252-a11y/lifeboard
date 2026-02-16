import { test as setup } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// .env.local 파일 읽기
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !process.env[match[1].trim()]) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
}

const authFile = "playwright/.auth/user.json";

setup("authenticate", async ({ page }) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const testEmail = process.env.TEST_USER_EMAIL || "test@lifeboard.dev";

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL 및 SUPABASE_SERVICE_ROLE_KEY 환경 변수가 필요합니다",
    );
  }

  // service_role 클라이언트 생성 (admin API 사용)
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // 테스트 사용자 생성 (이미 존재하면 무시)
  const { data: existingUser } = await supabase.auth.admin.listUsers();
  const userExists = existingUser?.users.some((u) => u.email === testEmail);

  if (!userExists) {
    const { error: createError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: process.env.TEST_USER_PASSWORD || "TestPass1234!@",
      email_confirm: true,
    });

    if (createError) {
      throw new Error(`테스트 사용자 생성 실패: ${createError.message}`);
    }
  }

  // 매직링크 세션 URL 생성
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: testEmail,
  });

  if (error || !data) {
    throw new Error(`세션 URL 생성 실패: ${error?.message}`);
  }

  // 세션 URL로 이동하여 access_token 획득
  await page.goto(data.properties.action_link);
  await page.waitForLoadState("networkidle");

  // URL 해시에서 access_token 추출
  const url = page.url();
  const hashParams = new URLSearchParams(url.split("#")[1] || "");
  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");

  if (!accessToken || !refreshToken) {
    throw new Error("매직링크에서 토큰을 가져올 수 없습니다");
  }

  // 토큰을 사용하여 사용자 정보 가져오기
  const { data: userData, error: userError } =
    await supabase.auth.getUser(accessToken);

  if (userError || !userData?.user) {
    throw new Error(
      `사용자 정보 가져오기 실패: ${userError?.message || "Unknown error"}`,
    );
  }

  // 세션 데이터 구성
  const sessionData = {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    expires_in: 3600,
    token_type: "bearer",
    user: {
      id: userData.user.id,
      email: testEmail,
      role: "authenticated",
      aud: "authenticated",
    },
  };

  // localStorage에 세션 설정 (브라우저 컨텍스트에서)
  await page.evaluate(
    ({ sessionData, projectRef }) => {
      const key = `sb-${projectRef}-auth-token`;
      localStorage.setItem(key, JSON.stringify(sessionData));
    },
    { sessionData, projectRef: "nfmoielnkfybljjqfmdp" },
  );

  // /protected 페이지로 이동하여 세션 확인
  await page.goto("http://localhost:3000/protected");
  await page.waitForLoadState("networkidle");

  // 로그인 페이지로 리다이렉트되지 않았는지 확인
  const currentUrl = page.url();
  if (currentUrl.includes("/auth/login")) {
    throw new Error("세션 설정 실패: 로그인 페이지로 리다이렉트됨");
  }

  // 세션 저장
  await page.context().storageState({ path: authFile });
});

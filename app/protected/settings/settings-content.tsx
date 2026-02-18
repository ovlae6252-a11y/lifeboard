import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserPreferences } from "@/lib/user/preferences";
import { ProfileSection } from "@/components/settings/profile-section";
import { CategoryPreferences } from "@/components/settings/category-preferences";
import { WidgetSettings } from "@/components/settings/widget-settings";

export async function SettingsContent() {
  const supabase = await createClient();

  // getClaims: 캐시된 JWT 검증으로 빠르게 인증 상태 확인
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims) {
    redirect("/auth/login");
  }

  // ProfileSection용 전체 User 객체 조회 (provider, email, created_at 등 필요)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  // 사용자 설정 조회
  const preferences = await getUserPreferences(claimsData.claims.sub);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">설정</h1>
        <p className="text-muted-foreground mt-2">
          계정 정보와 선호 설정을 관리할 수 있습니다
        </p>
      </div>

      <div className="space-y-6">
        <ProfileSection user={user} />
        <CategoryPreferences
          initialCategories={preferences.preferred_categories}
        />
        <WidgetSettings />
      </div>
    </div>
  );
}

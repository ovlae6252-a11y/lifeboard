import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserPreferences } from "@/lib/user/preferences";
import { ProfileSection } from "@/components/settings/profile-section";
import { CategoryPreferences } from "@/components/settings/category-preferences";

export async function SettingsContent() {
  const supabase = await createClient();

  // 사용자 인증 확인
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  // 사용자 설정 조회
  const preferences = await getUserPreferences(user.id);

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
      </div>
    </div>
  );
}

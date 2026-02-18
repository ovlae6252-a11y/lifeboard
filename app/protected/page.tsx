import { redirect } from "next/navigation";
import { Suspense } from "react";

import { NewsDashboardSection } from "@/components/news/news-dashboard-section";
import { NewsSkeleton } from "@/components/news/news-skeleton";
import { WeatherWidget } from "@/components/weather/weather-widget";
import { createClient } from "@/lib/supabase/server";
import { getUserPreferences } from "@/lib/user/preferences";

async function DashboardContent() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  const userId = data.claims.sub;
  const prefs = await getUserPreferences(userId);
  const dashboardConfig = prefs.dashboard_config as Record<string, unknown>;

  const hasWeatherKey = !!process.env.WEATHER_API_KEY;
  const showWeather = dashboardConfig?.showWeather !== false;
  const showNews = dashboardConfig?.showNews !== false;

  return (
    <div className="space-y-12">
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">
          대시보드
        </h1>
        <p className="text-muted-foreground mt-1">
          라이프보드에 오신 것을 환영합니다.
        </p>
      </div>

      {/* 날씨 위젯 */}
      {hasWeatherKey && showWeather && (
        <Suspense
          fallback={<div className="bg-muted h-32 animate-pulse rounded-xl" />}
        >
          <WeatherWidget location={prefs.weather_location} />
        </Suspense>
      )}

      {/* 최신 뉴스 섹션 */}
      {showNews && (
        <Suspense fallback={<NewsSkeleton count={6} />}>
          <NewsDashboardSection />
        </Suspense>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}

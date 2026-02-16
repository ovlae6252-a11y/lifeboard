import { redirect } from "next/navigation";
import { Suspense } from "react";

import { NewsDashboardSection } from "@/components/news/news-dashboard-section";
import { NewsSkeleton } from "@/components/news/news-skeleton";
import { createClient } from "@/lib/supabase/server";

async function DashboardContent() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

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

      {/* 최신 뉴스 섹션 */}
      <Suspense fallback={<NewsSkeleton count={6} />}>
        <NewsDashboardSection />
      </Suspense>
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

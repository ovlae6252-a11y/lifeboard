import { Suspense } from "react";
import { NewsManagementTabs } from "@/components/admin/news-management-tabs";

export default function AdminNewsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">뉴스 관리</h1>
        <p className="text-muted-foreground text-sm">
          뉴스 소스, 그룹, 기사를 관리합니다
        </p>
      </div>

      <Suspense fallback={<TabsSkeleton />}>
        <NewsManagementTabs />
      </Suspense>
    </div>
  );
}

function TabsSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="bg-muted h-10 w-72 rounded-lg" />
      <div className="bg-card border-border h-96 rounded-lg border" />
    </div>
  );
}

import { Suspense } from "react";
import { MonitoringTabs } from "@/components/admin/monitoring-tabs";

export default function AdminMonitoringPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">시스템 모니터링</h1>
        <p className="text-muted-foreground text-sm">
          수집 로그, 요약 작업, 시스템 상태를 확인합니다
        </p>
      </div>

      <Suspense fallback={<TabsSkeleton />}>
        <MonitoringTabs />
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

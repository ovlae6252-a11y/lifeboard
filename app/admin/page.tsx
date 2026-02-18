import { Suspense } from "react";
import {
  getSystemStats,
  getDailyCollectionStats,
  getCategoryDistribution,
  getRecentActivity,
} from "@/lib/admin/queries";
import { StatsCards } from "@/components/admin/stats-cards";
import { PipelineStatus } from "@/components/admin/pipeline-status";
import { QualityMetrics } from "@/components/admin/quality-metrics";
import { CollectionChart } from "@/components/admin/collection-chart";
import { CategoryChart } from "@/components/admin/category-chart";
import { RecentActivityLog } from "@/components/admin/recent-activity";

async function DashboardContent() {
  const [stats, daily, category, activity] = await Promise.all([
    getSystemStats(),
    getDailyCollectionStats(7),
    getCategoryDistribution(),
    getRecentActivity(),
  ]);

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <StatsCards stats={stats} />

      {/* 파이프라인 상태 + 품질 지표 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <PipelineStatus activity={activity} />
        <QualityMetrics stats={stats} />
      </div>

      {/* 차트 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <CollectionChart data={daily} />
        <CategoryChart data={category} />
      </div>

      {/* 최근 활동 */}
      <RecentActivityLog activity={activity} />
    </div>
  );
}

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">대시보드</h1>
        <p className="text-muted-foreground text-sm">
          시스템 전체 현황을 한눈에 확인합니다
        </p>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* 통계 카드 스켈레톤 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-card border-border h-24 rounded-lg border"
          />
        ))}
      </div>
      {/* 2열 스켈레톤 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-card border-border h-40 rounded-lg border" />
        <div className="bg-card border-border h-40 rounded-lg border" />
      </div>
      {/* 차트 스켈레톤 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-card border-border h-64 rounded-lg border" />
        <div className="bg-card border-border h-64 rounded-lg border" />
      </div>
      {/* 활동 로그 스켈레톤 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-card border-border h-48 rounded-lg border" />
        <div className="bg-card border-border h-48 rounded-lg border" />
      </div>
    </div>
  );
}

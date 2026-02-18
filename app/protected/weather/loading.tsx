import { Skeleton } from "@/components/ui/skeleton";

export default function WeatherLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* 헤더 스켈레톤 */}
      <div>
        <Skeleton className="h-8 w-24" />
        <Skeleton className="mt-1 h-4 w-48" />
      </div>

      {/* 현재 날씨 카드 스켈레톤 */}
      <Skeleton className="h-48 w-full rounded-xl" />

      {/* 시간별 예보 스켈레톤 */}
      <Skeleton className="h-40 w-full rounded-xl" />

      {/* 주간 예보 스켈레톤 */}
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

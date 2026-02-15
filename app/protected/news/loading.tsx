import { NewsSkeleton } from "@/components/news/news-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* 헤더 스켈레톤 */}
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-1 h-4 w-64" />
      </div>

      {/* 탭 스켈레톤 */}
      <Skeleton className="h-10 w-full" />

      {/* 뉴스 카드 + 페이지네이션 스켈레톤 */}
      <NewsSkeleton count={6} showPagination />
    </div>
  );
}

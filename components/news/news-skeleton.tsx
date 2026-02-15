import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface NewsSkeletonProps {
  count?: number;
  /** 하단 페이지네이션 스켈레톤 표시 여부 */
  showPagination?: boolean;
}

export function NewsSkeleton({
  count = 6,
  showPagination = false,
}: NewsSkeletonProps) {
  return (
    <div className="space-y-0">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-3 pb-4">
              {/* 카테고리 배지 + 시간 */}
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
              {/* 제목 */}
              <div className="space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* 팩트 요약 */}
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <Skeleton className="mt-1 h-1.5 w-1.5 rounded-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <div className="flex items-start gap-2.5">
                  <Skeleton className="mt-1 h-1.5 w-1.5 rounded-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
                <div className="flex items-start gap-2.5">
                  <Skeleton className="mt-1 h-1.5 w-1.5 rounded-full" />
                  <Skeleton className="h-4 w-4/6" />
                </div>
              </div>

              <Separator />

              {/* 원문 링크 */}
              <div className="space-y-2.5">
                <Skeleton className="h-3 w-20" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 페이지네이션 스켈레톤 */}
      {showPagination && (
        <div className="border-border/50 mt-8 flex items-center justify-between border-t pt-8">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-24" />
        </div>
      )}
    </div>
  );
}

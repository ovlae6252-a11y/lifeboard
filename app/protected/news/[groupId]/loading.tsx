import { Skeleton } from "@/components/ui/skeleton";

/**
 * 뉴스 상세 페이지 로딩 스켈레톤.
 * 뒤로가기 + 제목 + 메타 + 팩트 카드 + 기사 목록 스켈레톤.
 */
export default function NewsDetailLoading() {
  return (
    <div className="space-y-6">
      {/* 뒤로가기 버튼 스켈레톤 */}
      <Skeleton className="h-10 w-32" />

      {/* 헤더 스켈레톤 */}
      <div className="space-y-4">
        {/* 메타 배지들 */}
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24" />
        </div>

        {/* 제목 */}
        <Skeleton className="h-12 w-full md:h-14" />
      </div>

      {/* 팩트 요약 카드 스켈레톤 */}
      <div className="space-y-4 rounded-lg border p-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>

      {/* 관련 기사 목록 스켈레톤 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>

        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-lg border p-4">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

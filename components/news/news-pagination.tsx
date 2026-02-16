"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

interface NewsPaginationProps {
  currentPage: number;
  totalCount: number;
  pageSize?: number;
}

export function NewsPagination({
  currentPage,
  totalCount,
  pageSize = 20,
}: NewsPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.ceil(totalCount / pageSize);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  // 총 페이지가 1 이하면 페이지네이션 불필요
  if (totalPages <= 1) return null;

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());

    // 1페이지는 page 파라미터 생략하여 깔끔한 URL 유지
    if (newPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(newPage));
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <nav
      className="border-border/50 flex flex-col gap-3 border-t pt-8"
      aria-label="페이지 탐색"
    >
      <div className="flex items-center justify-between">
        {/* 이전 버튼 */}
        <Button
          variant="outline"
          disabled={!hasPrev}
          onClick={() => handlePageChange(currentPage - 1)}
          aria-label="이전 페이지로 이동"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="ml-1 hidden sm:inline">이전</span>
        </Button>

        {/* 페이지 정보 */}
        <span className="text-muted-foreground font-mono text-sm">
          {currentPage} / {totalPages} 페이지
        </span>

        {/* 다음 버튼 */}
        <Button
          variant="outline"
          disabled={!hasNext}
          onClick={() => handlePageChange(currentPage + 1)}
          aria-label="다음 페이지로 이동"
        >
          <span className="mr-1 hidden sm:inline">다음</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* 총 건수 */}
      <p className="text-muted-foreground text-center font-mono text-xs">
        전체 {totalCount}건
      </p>
    </nav>
  );
}

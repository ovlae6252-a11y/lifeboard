import { FolderOpen, Newspaper, SearchX } from "lucide-react";

import { getCategoryLabel } from "@/lib/news/categories";

interface NewsEmptyStateProps {
  /** 카테고리 값 - 없거나 "all"이면 전체 빈 상태, 있으면 카테고리별 빈 상태 */
  category?: string;
  /** 검색 쿼리 - 있으면 검색 결과 빈 상태 */
  query?: string;
}

export function NewsEmptyState({ category, query }: NewsEmptyStateProps) {
  // 검색 결과 빈 상태
  if (query) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <SearchX className="text-muted-foreground/40 h-12 w-12" />
        <p className="text-lg font-semibold">
          &quot;{query}&quot; 검색 결과가 없습니다
        </p>
        <div>
          <p className="text-muted-foreground text-sm">
            다른 키워드로 검색해 보세요
          </p>
          {category && category !== "all" && (
            <p className="text-muted-foreground/70 text-xs">
              또는 전체 카테고리에서 검색해 보세요
            </p>
          )}
        </div>
      </div>
    );
  }
  // 전체 빈 상태
  if (!category || category === "all") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <Newspaper className="text-muted-foreground/40 h-12 w-12" />
        <p className="text-lg font-semibold">아직 수집된 뉴스가 없습니다</p>
        <div>
          <p className="text-muted-foreground text-sm">
            뉴스는 하루 2회 자동으로 수집됩니다.
          </p>
          <p className="text-muted-foreground/70 text-xs">
            (오전 8시, 오후 8시)
          </p>
        </div>
      </div>
    );
  }

  // 카테고리별 빈 상태
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 py-16 text-center">
      <FolderOpen className="text-muted-foreground/40 h-10 w-10" />
      <p className="text-base font-medium">
        {getCategoryLabel(category)} 뉴스가 아직 없습니다
      </p>
      <p className="text-muted-foreground text-sm">
        다른 카테고리를 선택해 보세요
      </p>
    </div>
  );
}

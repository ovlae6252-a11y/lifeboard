import { Suspense } from "react";

import { NewsCategoryTabs } from "@/components/news/news-category-tabs";
import { NewsEmptyState } from "@/components/news/news-empty-state";
import { NewsList } from "@/components/news/news-list";
import { NewsPagination } from "@/components/news/news-pagination";
import { NewsSkeleton } from "@/components/news/news-skeleton";
import { getNewsGroups } from "@/lib/news/queries";

const PAGE_SIZE = 20;

export const metadata = {
  title: "뉴스 | Lifeboard",
};

// Suspense 경계 내에서 searchParams를 await하고 데이터를 페칭하는 async 컴포넌트
async function NewsContent({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const params = await searchParams;
  const category = params.category;
  const page = Math.max(1, Number(params.page) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const { groups, count } = await getNewsGroups({
    category: category && category !== "all" ? category : undefined,
    limit: PAGE_SIZE,
    offset,
  });

  // 빈 상태 처리
  if (count === 0) {
    return <NewsEmptyState category={category} />;
  }

  return (
    <>
      <NewsList groups={groups} />
      <NewsPagination
        currentPage={page}
        totalCount={count}
        pageSize={PAGE_SIZE}
      />
    </>
  );
}

export default function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-bold">뉴스</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          한국 주요 언론사의 최신 뉴스를 AI가 팩트 중심으로 요약합니다.
        </p>
      </div>

      {/* 카테고리 탭 (Client Component - useSearchParams 사용) */}
      <Suspense>
        <NewsCategoryTabs />
      </Suspense>

      {/* 뉴스 목록 + 페이지네이션 (searchParams await + 데이터 페칭을 Suspense 내부에서 수행) */}
      <Suspense fallback={<NewsSkeleton />}>
        <NewsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

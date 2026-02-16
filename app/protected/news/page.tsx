import { Suspense } from "react";

import { NewsCategoryTabs } from "@/components/news/news-category-tabs";
import { NewsEmptyState } from "@/components/news/news-empty-state";
import { NewsList } from "@/components/news/news-list";
import { NewsPagination } from "@/components/news/news-pagination";
import { NewsSearchBar } from "@/components/news/news-search-bar";
import { NewsSkeleton } from "@/components/news/news-skeleton";
import {
  getNewsGroups,
  getUserBookmarkedGroups,
  searchNewsGroups,
} from "@/lib/news/queries";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 20;

export const metadata = {
  title: "뉴스 | Lifeboard",
};

// Suspense 경계 내에서 searchParams를 await하고 데이터를 페칭하는 async 컴포넌트
async function NewsContent({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string; q?: string }>;
}) {
  const params = await searchParams;
  const category = params.category;
  const page = Math.max(1, Number(params.page) || 1);
  const query = params.q?.trim();

  // 사용자 인증 정보 가져오기 (북마크 기능용)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 사용자 북마크 목록 가져오기 (로그인한 경우)
  let userBookmarks: string[] = [];
  if (user) {
    const { data: bookmarkData } = await supabase
      .from("user_bookmarks")
      .select("group_id")
      .eq("user_id", user.id);

    userBookmarks = bookmarkData?.map((b) => b.group_id) ?? [];
  }

  // 북마크 탭일 때
  if (category === "bookmarks") {
    if (!user) {
      // 비로그인 상태면 빈 상태 표시
      return <NewsEmptyState category="bookmarks" />;
    }

    const { groups, count } = await getUserBookmarkedGroups(
      user.id,
      page,
      PAGE_SIZE,
    );

    if (count === 0) {
      return <NewsEmptyState category="bookmarks" />;
    }

    return (
      <>
        <NewsList groups={groups} userBookmarks={userBookmarks} />
        <NewsPagination
          currentPage={page}
          totalCount={count}
          pageSize={PAGE_SIZE}
        />
      </>
    );
  }

  // 검색 쿼리가 있으면 searchNewsGroups 호출, 없으면 getNewsGroups 호출
  const { groups, count } = query
    ? await searchNewsGroups(
        query,
        category && category !== "all" ? category : undefined,
        page,
        PAGE_SIZE,
      )
    : await getNewsGroups({
        category: category && category !== "all" ? category : undefined,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      });

  // 빈 상태 처리
  if (count === 0) {
    return <NewsEmptyState category={category} query={query} />;
  }

  return (
    <>
      <NewsList groups={groups} userBookmarks={userBookmarks} />
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
  searchParams: Promise<{ category?: string; page?: string; q?: string }>;
}) {
  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="font-serif text-2xl font-bold">뉴스</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          한국 주요 언론사의 최신 뉴스를 AI가 팩트 중심으로 요약합니다.
        </p>
      </div>

      {/* 검색바 (Client Component - useRouter, useSearchParams 사용) */}
      <Suspense>
        <NewsSearchBar />
      </Suspense>

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

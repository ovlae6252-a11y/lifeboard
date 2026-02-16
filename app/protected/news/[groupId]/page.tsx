import { notFound } from "next/navigation";
import { Suspense } from "react";

import { NewsDetail } from "@/components/news/news-detail";
import { Skeleton } from "@/components/ui/skeleton";
import { getNewsGroupDetail, getRelatedArticles } from "@/lib/news/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "뉴스 상세 | Lifeboard",
};

// 빌드 타임 검증을 위한 더미 파라미터 (cacheComponents: true 필수 요구사항)
export function generateStaticParams() {
  return [{ groupId: "00000000-0000-0000-0000-000000000000" }];
}

// Suspense 경계 내에서 params를 await하고 데이터를 페칭하는 async 컴포넌트
async function NewsDetailContent({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;

  // 그룹 상세 정보 조회
  const group = await getNewsGroupDetail(groupId);

  if (!group) {
    notFound();
  }

  // 관련 기사 조회
  const articles = await getRelatedArticles(groupId);

  // 사용자 북마크 목록 조회
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userBookmarks: string[] = [];
  if (user) {
    const { data: bookmarkData } = await supabase
      .from("user_bookmarks")
      .select("group_id")
      .eq("user_id", user.id);

    userBookmarks = bookmarkData?.map((b) => b.group_id) ?? [];
  }

  return (
    <NewsDetail
      group={group}
      relatedArticles={articles}
      userBookmarks={userBookmarks}
    />
  );
}

export default function NewsDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-10 w-32" />
          <div className="space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-12 w-full" />
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      }
    >
      <NewsDetailContent params={params} />
    </Suspense>
  );
}

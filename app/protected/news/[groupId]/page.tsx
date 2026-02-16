import { ArrowLeft, Calendar } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { FactSummaryCard } from "@/components/news/fact-summary-card";
import { RelatedArticlesList } from "@/components/news/related-articles-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getCategoryLabel } from "@/lib/news/categories";
import { getNewsGroupDetail, getRelatedArticles } from "@/lib/news/queries";
import { formatRelativeTime } from "@/lib/utils/format-time";

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

  const title = group.representative_article?.title ?? "제목 없음";
  const publishedAt =
    group.representative_article?.published_at ?? group.created_at;

  return (
    <div className="space-y-6">
      {/* 뒤로가기 버튼 */}
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/protected/news" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            뉴스 목록
          </Link>
        </Button>
      </div>

      {/* 헤더: 제목 + 메타정보 */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="bg-primary/10 text-primary rounded-full border-transparent"
          >
            {getCategoryLabel(group.category)}
          </Badge>
          <Badge variant="outline" className="rounded-full font-mono text-xs">
            {group.article_count}개 기사
          </Badge>
          <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <Calendar className="h-3.5 w-3.5" />
            <time dateTime={publishedAt}>
              {formatRelativeTime(publishedAt)}
            </time>
          </span>
        </div>

        <h1 className="font-serif text-2xl leading-tight font-bold md:text-3xl">
          {title}
        </h1>
      </div>

      {/* 팩트 요약 */}
      <FactSummaryCard
        factSummary={group.fact_summary}
        isSummarized={group.is_summarized}
      />

      {/* 관련 기사 목록 */}
      <RelatedArticlesList articles={articles} />
    </div>
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

import { ArrowLeft, Calendar } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCategoryLabel } from "@/lib/news/categories";
import { formatRelativeTime } from "@/lib/utils/format-time";

import { FactSummaryCard } from "./fact-summary-card";
import { RelatedArticlesList } from "./related-articles-list";

interface NewsDetailProps {
  group: {
    id: string;
    category: string;
    article_count: number;
    fact_summary: string | null;
    is_summarized: boolean;
    created_at: string;
    representative_article: {
      title: string;
      published_at: string | null;
    } | null;
  };
  relatedArticles: Array<{
    id: string;
    title: string;
    original_url: string;
    published_at: string | null;
    source: { name: string } | null;
  }>;
}

export function NewsDetail({ group, relatedArticles }: NewsDetailProps) {
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
          <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <Calendar className="h-3.5 w-3.5" />
            <time dateTime={publishedAt}>
              {formatRelativeTime(publishedAt)}
            </time>
          </span>
          <span className="text-muted-foreground font-mono text-sm">
            {group.article_count}개 기사
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
      <RelatedArticlesList articles={relatedArticles} />
    </div>
  );
}

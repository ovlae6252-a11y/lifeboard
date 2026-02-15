import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getCategoryLabel } from "@/lib/news/categories";
import type { NewsGroupWithArticles } from "@/lib/news/queries";
import { formatRelativeTime } from "@/lib/utils/format-time";
import { parseFacts } from "@/lib/utils/parse-facts";

// 원문 링크 최대 표시 개수
const MAX_VISIBLE_ARTICLES = 3;

interface NewsGroupCardProps {
  group: NewsGroupWithArticles;
}

export function NewsGroupCard({ group }: NewsGroupCardProps) {
  const { representative_article: rep, articles } = group;
  const title = rep?.title ?? "제목 없음";
  const publishedAt = rep?.published_at ?? group.created_at;

  // 팩트 요약 파싱
  const hasSummary = group.is_summarized && group.fact_summary;
  const facts = hasSummary ? parseFacts(group.fact_summary!) : [];

  // 원문 링크 (최대 3개 + 나머지, null 방어)
  const safeArticles = articles ?? [];
  const visibleArticles = safeArticles.slice(0, MAX_VISIBLE_ARTICLES);
  const remainingCount = Math.max(0, safeArticles.length - MAX_VISIBLE_ARTICLES);

  return (
    <Card className="group transition-colors hover:border-primary/20">
      <CardHeader className="space-y-3 pb-4">
        {/* 카테고리 배지 + 상대 시간 */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="rounded-full border-transparent bg-primary/10 text-xs font-medium text-primary">
            {getCategoryLabel(group.category)}
          </Badge>
          <time dateTime={publishedAt} className="text-xs text-muted-foreground">
            {formatRelativeTime(publishedAt)}
          </time>
        </div>

        {/* 대표 기사 제목 */}
        <CardTitle className="text-lg leading-snug line-clamp-2">
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 팩트 요약 또는 원본 설명 */}
        {hasSummary && facts.length > 0 ? (
          <ul className="space-y-2 border-l-2 border-accent pl-4">
            {facts.map((fact, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                {fact}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">
            {rep?.description ?? "요약을 처리하고 있습니다..."}
          </p>
        )}

        <Separator />

        {/* 관련 기사 원문 링크 */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              관련 기사
            </span>
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              {group.article_count}개
            </Badge>
          </div>

          <div className="space-y-1.5">
            {visibleArticles.map((article) => (
              <a
                key={article.id}
                href={article.original_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-md px-1 py-0.5 transition-colors hover:bg-accent/50"
              >
                <span className="shrink-0 text-[10px] text-muted-foreground/70 w-14 truncate">
                  {article.source?.name ?? "알 수 없음"}
                </span>
                <span className="flex-1 truncate text-sm">
                  {article.title}
                </span>
                <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground/50" />
              </a>
            ))}

            {remainingCount > 0 && (
              <p className="px-1 text-xs text-muted-foreground/60">
                외 {remainingCount}개 기사
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

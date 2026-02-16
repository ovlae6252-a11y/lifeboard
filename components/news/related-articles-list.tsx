import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import { RelativeTime } from "./relative-time";

interface RelatedArticle {
  id: string;
  title: string;
  original_url: string;
  published_at: string | null;
  source: { name: string } | null;
}

interface RelatedArticlesListProps {
  articles: RelatedArticle[];
}

/**
 * 관련 기사 목록 컴포넌트.
 * 그룹 내 모든 기사를 외부 링크로 표시.
 * Server Component.
 */
export function RelatedArticlesList({ articles }: RelatedArticlesListProps) {
  if (articles.length === 0) {
    return (
      <section aria-labelledby="related-articles-heading">
        <h2
          id="related-articles-heading"
          className="mb-4 font-serif text-lg font-semibold"
        >
          관련 기사
        </h2>
        <Card className="p-6">
          <p className="text-muted-foreground text-center">
            관련 기사가 없습니다.
          </p>
        </Card>
      </section>
    );
  }

  return (
    <section aria-labelledby="related-articles-heading">
      <div className="mb-4 flex items-center justify-between">
        <h2
          id="related-articles-heading"
          className="font-serif text-lg font-semibold"
        >
          관련 기사
        </h2>
        <Badge variant="outline" className="font-mono text-xs">
          {articles.length}개
        </Badge>
      </div>

      <div className="space-y-3">
        {articles.map((article) => (
          <a
            key={article.id}
            href={article.original_url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block"
          >
            <Card className="hover:bg-accent/50 flex items-start gap-3 p-4 transition-colors">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {article.source && (
                    <Badge
                      variant="outline"
                      className="text-muted-foreground rounded-full text-xs"
                    >
                      {article.source.name}
                    </Badge>
                  )}
                  {article.published_at && (
                    <RelativeTime
                      dateTime={article.published_at}
                      showIcon={false}
                      className="hidden font-mono text-xs sm:block"
                    />
                  )}
                </div>
                <h3 className="group-hover:text-primary line-clamp-2 font-serif text-sm leading-snug transition-colors">
                  {article.title}
                </h3>
              </div>
              <ExternalLink className="text-muted-foreground h-4 w-4 flex-shrink-0" />
            </Card>
          </a>
        ))}
      </div>
    </section>
  );
}

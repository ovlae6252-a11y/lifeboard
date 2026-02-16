import { ExternalLink } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/utils/format-time";

interface RelatedArticle {
  id: string;
  title: string;
  original_url: string;
  published_at: string | null;
  source: { name: string } | null;
}

interface RelatedArticlesListProps {
  articles: RelatedArticle[];
  articleCount: number;
}

export function RelatedArticlesList({
  articles,
  articleCount,
}: RelatedArticlesListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-lg font-semibold">
          관련 기사 {articleCount}개
        </CardTitle>
      </CardHeader>
      <CardContent>
        {articles.length > 0 ? (
          <div className="space-y-3">
            {articles.map((article) => (
              <a
                key={article.id}
                href={article.original_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:bg-accent/50 group flex items-start gap-3 rounded-lg p-3 transition-colors"
              >
                <div className="flex-1 space-y-1">
                  <h4 className="group-hover:text-primary text-sm leading-snug font-medium transition-colors">
                    {article.title}
                  </h4>
                  <div className="text-muted-foreground flex items-center gap-2 text-xs">
                    <span>{article.source?.name ?? "알 수 없음"}</span>
                    {article.published_at && (
                      <>
                        <span>·</span>
                        <time dateTime={article.published_at}>
                          {formatRelativeTime(article.published_at)}
                        </time>
                      </>
                    )}
                  </div>
                </div>
                <ExternalLink className="text-muted-foreground/50 group-hover:text-primary/50 mt-1 h-4 w-4 shrink-0 transition-colors" />
              </a>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">관련 기사가 없습니다.</p>
        )}
      </CardContent>
    </Card>
  );
}

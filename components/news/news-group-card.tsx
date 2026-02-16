import { Newspaper } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getCategoryLabel } from "@/lib/news/categories";
import type { NewsGroupWithArticles } from "@/lib/news/queries";
import { formatRelativeTime } from "@/lib/utils/format-time";
import { getNewsImageUrl } from "@/lib/utils/news-image";

import { CategoryGradient } from "./category-gradient";

interface NewsGroupCardProps {
  group: NewsGroupWithArticles;
}

export function NewsGroupCard({ group }: NewsGroupCardProps) {
  const { representative_article: rep } = group;
  const title = rep?.title ?? "제목 없음";
  const publishedAt = rep?.published_at ?? group.created_at;
  const imageUrl = getNewsImageUrl(rep?.image_url ?? null);

  return (
    <Link href={`/protected/news/${group.id}`} className="group block">
      <Card className="hover:border-primary/30 flex flex-col gap-0 overflow-hidden transition-all hover:shadow-md md:flex-row">
        {/* 이미지 영역 */}
        <div className="bg-muted relative aspect-video w-full shrink-0 overflow-hidden md:aspect-[4/3] md:w-48">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <CategoryGradient
              category={group.category}
              className="h-full w-full"
            />
          )}
        </div>

        {/* 메타정보 영역 */}
        <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 md:p-5">
          {/* 카테고리 배지 + 기사 수 배지 */}
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-primary/10 text-primary rounded-full border-transparent text-xs font-medium"
            >
              {getCategoryLabel(group.category)}
            </Badge>
            <Badge
              variant="outline"
              className="bg-muted text-muted-foreground rounded-full border-transparent font-mono text-[10px]"
            >
              <Newspaper className="mr-1 h-3 w-3" />
              {group.article_count}개
            </Badge>
          </div>

          {/* 대표 기사 제목 */}
          <h3 className="group-hover:text-primary line-clamp-2 font-serif text-base leading-tight font-semibold transition-colors md:text-lg">
            {title}
          </h3>

          {/* 상대 시간 */}
          <time
            dateTime={publishedAt}
            className="text-muted-foreground mt-auto font-mono text-xs"
          >
            {formatRelativeTime(publishedAt)}
          </time>
        </div>
      </Card>
    </Link>
  );
}

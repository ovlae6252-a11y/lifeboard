import { Newspaper } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getCategoryLabel } from "@/lib/news/categories";
import type { NewsGroupWithArticles } from "@/lib/news/queries";
import { formatRelativeTime } from "@/lib/utils/format-time";
import { getNewsImageUrl } from "@/lib/utils/news-image";

interface NewsGroupCardProps {
  group: NewsGroupWithArticles;
}

export function NewsGroupCard({ group }: NewsGroupCardProps) {
  const { representative_article: rep } = group;
  const title = rep?.title ?? "제목 없음";
  const publishedAt = rep?.published_at ?? group.created_at;
  const imageUrl = getNewsImageUrl(rep?.image_url ?? null, group.category);

  return (
    <Link href={`/protected/news/${group.id}`}>
      <Card className="group hover:border-primary/20 overflow-hidden transition-colors">
        {/* 모바일: 상단 이미지, 데스크톱: 좌측 썸네일 */}
        <div className="flex flex-col sm:flex-row">
          {/* 이미지 영역 */}
          <div className="bg-muted relative aspect-video w-full shrink-0 overflow-hidden sm:aspect-square sm:w-32 md:w-40">
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 128px, 160px"
            />
          </div>

          {/* 메타정보 영역 */}
          <div className="flex flex-1 flex-col justify-between gap-3 p-4">
            {/* 카테고리 배지 + 상대 시간 */}
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-primary/10 text-primary rounded-full border-transparent text-xs font-medium"
              >
                {getCategoryLabel(group.category)}
              </Badge>
              <time
                dateTime={publishedAt}
                className="text-muted-foreground font-mono text-xs"
              >
                {formatRelativeTime(publishedAt)}
              </time>
            </div>

            {/* 대표 기사 제목 */}
            <h3 className="line-clamp-2 font-serif text-base leading-snug font-semibold sm:text-lg">
              {title}
            </h3>

            {/* 기사 수 */}
            <div className="text-muted-foreground flex items-center gap-1.5">
              <Newspaper className="h-3.5 w-3.5" />
              <span className="font-mono text-xs">
                {group.article_count}개 기사
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

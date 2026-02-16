"use client";

import { Newspaper } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getCategoryLabel } from "@/lib/news/categories";
import type { NewsGroupWithArticles } from "@/lib/news/queries";
import { getNewsImageUrl } from "@/lib/utils/news-image";

import { BookmarkButton } from "./bookmark-button";
import { CategoryGradient } from "./category-gradient";
import { RelativeTime } from "./relative-time";

interface NewsGroupCardProps {
  group: NewsGroupWithArticles;
  /** 사용자 북마크 그룹 ID 목록 */
  userBookmarks: string[];
}

export function NewsGroupCard({ group, userBookmarks }: NewsGroupCardProps) {
  const { representative_article: rep } = group;
  const title = rep?.title ?? "제목 없음";
  const publishedAt = rep?.published_at ?? group.created_at;
  const imageUrl = getNewsImageUrl(rep?.image_url ?? null);
  const isBookmarked = userBookmarks.includes(group.id);

  return (
    <div className="group relative">
      <Link href={`/protected/news/${group.id}`} className="block">
        <Card className="hover:border-primary/30 flex flex-col gap-0 overflow-hidden transition-all hover:shadow-md md:flex-row">
          {/* 이미지 영역 */}
          <div className="bg-muted relative aspect-video w-full shrink-0 overflow-hidden md:aspect-[4/3] md:w-48">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 192px"
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
            <RelativeTime
              dateTime={publishedAt}
              showIcon={false}
              className="mt-auto font-mono text-xs"
            />
          </div>
        </Card>
      </Link>

      {/* 북마크 버튼 - 카드 우측 상단 */}
      <div
        className="absolute top-3 right-3 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <BookmarkButton
          groupId={group.id}
          isBookmarked={isBookmarked}
          size="icon"
          variant="outline"
        />
      </div>
    </div>
  );
}

import { Newspaper } from "lucide-react";

import { NewsGroupCard } from "@/components/news/news-group-card";
import type { NewsGroupWithArticles } from "@/lib/news/queries";

interface NewsListProps {
  groups: NewsGroupWithArticles[];
}

export function NewsList({ groups }: NewsListProps) {
  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <Newspaper className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          해당 카테고리의 뉴스가 아직 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {groups.map((group) => (
        <NewsGroupCard key={group.id} group={group} />
      ))}
    </div>
  );
}

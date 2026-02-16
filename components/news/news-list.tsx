import { NewsGroupCard } from "@/components/news/news-group-card";
import type { NewsGroupWithArticles } from "@/lib/news/queries";

interface NewsListProps {
  groups: NewsGroupWithArticles[];
  /** 사용자 북마크 그룹 ID 목록 */
  userBookmarks: string[];
}

export function NewsList({ groups, userBookmarks }: NewsListProps) {
  if (groups.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {groups.map((group) => (
        <NewsGroupCard
          key={group.id}
          group={group}
          userBookmarks={userBookmarks}
        />
      ))}
    </div>
  );
}

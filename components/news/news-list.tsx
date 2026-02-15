import { NewsGroupCard } from "@/components/news/news-group-card";
import type { NewsGroupWithArticles } from "@/lib/news/queries";

interface NewsListProps {
  groups: NewsGroupWithArticles[];
}

export function NewsList({ groups }: NewsListProps) {
  if (groups.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {groups.map((group) => (
        <NewsGroupCard key={group.id} group={group} />
      ))}
    </div>
  );
}

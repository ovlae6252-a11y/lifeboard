import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { NewsGroupCard } from "@/components/news/news-group-card";
import { getLatestNewsGroups } from "@/lib/news/queries";
import { createClient } from "@/lib/supabase/server";

export async function NewsDashboardSection() {
  const groups = await getLatestNewsGroups(6);

  // 뉴스가 없으면 섹션 자체를 숨김
  if (groups.length === 0) return null;

  // 사용자 북마크 목록 가져오기
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userBookmarks: string[] = [];
  if (user) {
    const { data: bookmarkData } = await supabase
      .from("user_bookmarks")
      .select("group_id")
      .eq("user_id", user.id);

    userBookmarks = bookmarkData?.map((b) => b.group_id) ?? [];
  }

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-serif text-xl font-bold">최신 뉴스</h2>
        <Link
          href="/protected/news"
          className="text-muted-foreground hover:text-primary flex items-center gap-1 text-sm transition-colors"
        >
          더보기
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {groups.map((group) => (
          <NewsGroupCard
            key={group.id}
            group={group}
            userBookmarks={userBookmarks}
          />
        ))}
      </div>
    </section>
  );
}

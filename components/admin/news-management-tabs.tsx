"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewsSourceManager } from "./news-source-manager";
import { NewsGroupManager } from "./news-group-manager";
import { NewsArticleManager } from "./news-article-manager";

const TABS = [
  { value: "sources", label: "소스 관리" },
  { value: "groups", label: "그룹 관리" },
  { value: "articles", label: "기사 관리" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

export function NewsManagementTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") ?? "sources") as TabValue;

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`?${params.toString()}`);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList>
        {TABS.map(({ value, label }) => (
          <TabsTrigger key={value} value={value}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="sources" className="mt-4">
        <NewsSourceManager />
      </TabsContent>

      <TabsContent value="groups" className="mt-4">
        <NewsGroupManager />
      </TabsContent>

      <TabsContent value="articles" className="mt-4">
        <NewsArticleManager />
      </TabsContent>
    </Tabs>
  );
}

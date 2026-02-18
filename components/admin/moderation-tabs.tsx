"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FilterManager } from "./filter-manager";
import { QualityReviewQueue } from "./quality-review-queue";

const TABS = [
  { value: "filters", label: "필터 관리" },
  { value: "quality", label: "품질 검토" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

export function ModerationTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") ?? "filters") as TabValue;

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

      <TabsContent value="filters" className="mt-4">
        <FilterManager />
      </TabsContent>

      <TabsContent value="quality" className="mt-4">
        <QualityReviewQueue />
      </TabsContent>
    </Tabs>
  );
}

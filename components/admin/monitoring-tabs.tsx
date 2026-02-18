"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FetchLogViewer } from "@/components/admin/fetch-log-viewer";
import { JobManager } from "@/components/admin/job-manager";
import { SystemStatus } from "@/components/admin/system-status";

type TabValue = "logs" | "jobs" | "status";

export function MonitoringTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") ?? "logs") as TabValue;

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`?${params.toString()}`);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="logs">수집 로그</TabsTrigger>
        <TabsTrigger value="jobs">요약 작업</TabsTrigger>
        <TabsTrigger value="status">시스템 상태</TabsTrigger>
      </TabsList>

      <TabsContent value="logs" className="mt-4">
        <FetchLogViewer />
      </TabsContent>

      <TabsContent value="jobs" className="mt-4">
        <JobManager />
      </TabsContent>

      <TabsContent value="status" className="mt-4">
        <SystemStatus />
      </TabsContent>
    </Tabs>
  );
}

"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Activity, Clock, Database, FileText, Layers, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SystemStatusData {
  lastCronRun: string | null;
  lastWorkerActivity: string | null;
  tableStats: {
    groups: number;
    articles: number;
    jobs: number;
    logs: number;
  };
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "없음";
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SystemStatus() {
  const [data, setData] = useState<SystemStatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/monitoring/status")
      .then((r) => r.json())
      .then(setData)
      .catch(() => toast.error("시스템 상태 조회에 실패했습니다"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="bg-card border-border h-24 rounded-lg border"
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-card border-border h-20 rounded-lg border"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const pipelineItems = [
    {
      label: "마지막 Cron 실행",
      value: formatDate(data.lastCronRun),
      relative: formatRelativeTime(data.lastCronRun),
      icon: Clock,
      color: "text-blue-500",
    },
    {
      label: "마지막 워커 활동",
      value: formatDate(data.lastWorkerActivity),
      relative: formatRelativeTime(data.lastWorkerActivity),
      icon: Zap,
      color: "text-amber-500",
    },
  ];

  const tableItems = [
    {
      label: "뉴스 그룹",
      value: data.tableStats.groups,
      icon: Layers,
      color: "text-purple-500",
    },
    {
      label: "뉴스 기사",
      value: data.tableStats.articles,
      icon: FileText,
      color: "text-green-500",
    },
    {
      label: "요약 작업",
      value: data.tableStats.jobs,
      icon: Activity,
      color: "text-orange-500",
    },
    {
      label: "수집 로그",
      value: data.tableStats.logs,
      icon: Database,
      color: "text-slate-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 파이프라인 상태 */}
      <div>
        <h3 className="mb-3 text-sm font-medium">파이프라인 상태</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {pipelineItems.map(
            ({ label, value, relative, icon: Icon, color }) => (
              <Card key={label}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${color}`} />
                    <div>
                      <p className="text-muted-foreground text-xs">{label}</p>
                      <p className="text-sm font-semibold tabular-nums">
                        {relative}
                      </p>
                      <p className="text-muted-foreground text-xs">{value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ),
          )}
        </div>
      </div>

      {/* DB 통계 */}
      <div>
        <h3 className="mb-3 text-sm font-medium">데이터베이스 통계</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {tableItems.map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Icon className={`h-5 w-5 shrink-0 ${color}`} />
                  <div>
                    <p className="text-muted-foreground text-xs">{label}</p>
                    <p className="text-xl font-bold tabular-nums">
                      {value.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

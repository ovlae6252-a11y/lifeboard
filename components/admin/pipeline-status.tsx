"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RecentActivity } from "@/lib/admin/queries";

interface PipelineStatusProps {
  activity: RecentActivity;
}

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

export function PipelineStatus({ activity }: PipelineStatusProps) {
  const logs = activity.fetchLogs;
  const lastLog = logs[0] ?? null;
  const successCount = logs.filter((l) => l.status === "success").length;
  const failCount = logs.filter((l) => l.status === "error").length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          수집 파이프라인 상태
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">마지막 수집</span>
          {lastLog ? (
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  lastLog.status === "success" ? "secondary" : "destructive"
                }
              >
                {lastLog.status === "success" ? "성공" : "실패"}
              </Badge>
              <span className="text-muted-foreground text-xs">
                {formatRelativeTime(lastLog.created_at)}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">없음</span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">
            최근 5건 성공/실패
          </span>
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-semibold text-green-500">{successCount}</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-destructive font-semibold">{failCount}</span>
          </div>
        </div>

        {lastLog && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">
              마지막 수집 기사 수
            </span>
            <span className="text-sm font-semibold tabular-nums">
              {(lastLog.articles_new ?? 0).toLocaleString()}건
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

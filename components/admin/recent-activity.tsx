import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RecentActivity } from "@/lib/admin/queries";

interface RecentActivityProps {
  activity: RecentActivity;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "success" || status === "completed") {
    return (
      <Badge
        variant="secondary"
        className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
      >
        성공
      </Badge>
    );
  }
  if (status === "error" || status === "failed") {
    return <Badge variant="destructive">실패</Badge>;
  }
  if (status === "pending") {
    return <Badge variant="secondary">대기</Badge>;
  }
  if (status === "processing") {
    return <Badge variant="outline">처리 중</Badge>;
  }
  return <Badge variant="secondary">{status}</Badge>;
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RecentActivityLog({ activity }: RecentActivityProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* 수집 로그 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">최근 수집 로그</CardTitle>
        </CardHeader>
        <CardContent>
          {activity.fetchLogs.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              수집 기록 없음
            </p>
          ) : (
            <div className="space-y-2">
              {activity.fetchLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground truncate">
                      소스: {log.source_id.slice(0, 8)}...
                    </p>
                    <p className="text-muted-foreground">
                      {formatTime(log.created_at)} · +{log.articles_new ?? 0}건
                    </p>
                  </div>
                  <StatusBadge status={log.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 요약 작업 로그 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">최근 요약 작업</CardTitle>
        </CardHeader>
        <CardContent>
          {activity.summarizeJobs.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              요약 작업 기록 없음
            </p>
          ) : (
            <div className="space-y-2">
              {activity.summarizeJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground truncate">
                      그룹: {job.group_id.slice(0, 8)}...
                    </p>
                    <p className="text-muted-foreground">
                      {formatTime(job.created_at)}
                    </p>
                    {job.error_message && (
                      <p className="text-destructive truncate">
                        {job.error_message}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={job.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

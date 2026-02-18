import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SystemStats } from "@/lib/admin/queries";

interface QualityMetricsProps {
  stats: SystemStats;
}

export function QualityMetrics({ stats }: QualityMetricsProps) {
  const validRatio =
    stats.totalGroups > 0
      ? Math.round((stats.validGroups / stats.totalGroups) * 100)
      : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">요약 품질 지표</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">유효 그룹 비율</span>
          <div className="flex items-center gap-2">
            <div className="bg-muted h-2 w-24 overflow-hidden rounded-full">
              <div
                className="h-full rounded-full bg-green-500"
                style={{ width: `${validRatio}%` }}
              />
            </div>
            <span className="text-sm font-semibold tabular-nums">
              {validRatio}%
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">유효 그룹</span>
          <span className="text-sm font-semibold tabular-nums">
            {stats.validGroups.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">
            유효하지 않은 요약
          </span>
          <Badge
            variant={stats.invalidSummaries > 0 ? "destructive" : "secondary"}
          >
            {stats.invalidSummaries.toLocaleString()}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

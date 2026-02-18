import { Layers, Newspaper, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { SystemStats } from "@/lib/admin/queries";

interface StatsCardsProps {
  stats: SystemStats;
}

const cardItems = [
  {
    key: "totalGroups" as const,
    label: "전체 그룹 수",
    icon: Layers,
    color: "text-blue-500",
  },
  {
    key: "todayArticles" as const,
    label: "오늘 수집 기사",
    icon: Newspaper,
    color: "text-green-500",
  },
  {
    key: "pendingJobs" as const,
    label: "대기 중 요약 작업",
    icon: Clock,
    color: "text-amber-500",
  },
  {
    key: "invalidSummaries" as const,
    label: "유효하지 않은 요약",
    icon: AlertTriangle,
    color: "text-destructive",
  },
];

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cardItems.map(({ key, label, icon: Icon, color }) => (
        <Card key={key}>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Icon className={`h-5 w-5 shrink-0 ${color}`} />
              <div>
                <p className="text-muted-foreground text-xs">{label}</p>
                <p className="text-2xl font-bold tabular-nums">
                  {stats[key].toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

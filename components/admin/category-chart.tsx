"use client";

import { Pie, PieChart, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { CategoryStat } from "@/lib/admin/queries";

interface CategoryChartProps {
  data: CategoryStat[];
}

// 카테고리별 색상 팔레트
const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function CategoryChart({ data }: CategoryChartProps) {
  const chartConfig = data.reduce<ChartConfig>((acc, item, i) => {
    acc[item.category] = {
      label: item.category,
      color: COLORS[i % COLORS.length],
    };
    return acc;
  }, {});

  const chartData = data.map((item, i) => ({
    ...item,
    fill: COLORS[i % COLORS.length],
  }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          카테고리별 기사 분포
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-muted-foreground py-16 text-center text-sm">
            데이터 없음
          </p>
        ) : (
          <div className="flex items-center gap-4">
            <ChartContainer config={chartConfig} className="h-48 w-48 shrink-0">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                >
                  {chartData.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="min-w-0 flex-1 space-y-1">
              {data.slice(0, 6).map((item, i) => (
                <div
                  key={item.category}
                  className="flex items-center gap-2 text-xs"
                >
                  <div
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="text-muted-foreground truncate">
                    {item.category}
                  </span>
                  <span className="ml-auto font-medium tabular-nums">
                    {item.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DailyCollectionStat } from "@/lib/admin/queries";

interface CollectionChartProps {
  data: DailyCollectionStat[];
}

const chartConfig = {
  count: {
    label: "수집 기사 수",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function CollectionChart({ data }: CollectionChartProps) {
  const chartData = data.map((d) => ({
    date: d.date.slice(5), // MM-DD 형식
    count: d.count,
  }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">7일 일별 수집량</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-48 w-full">
          <BarChart
            data={chartData}
            margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              allowDecimals={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={3} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

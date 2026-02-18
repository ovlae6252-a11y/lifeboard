import { Droplets } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HourlyForecast as HourlyForecastType } from "@/lib/weather/api";
import { getWeatherIcon, getWeatherIconColor } from "@/lib/weather/icons";

interface HourlyForecastProps {
  forecasts: HourlyForecastType[];
}

/**
 * 시간별 예보 컴포넌트 (3시간 간격, 최대 8개 = 24시간)
 * Server Component - 데이터를 props로 받아 렌더링
 */
export function HourlyForecast({ forecasts }: HourlyForecastProps) {
  if (forecasts.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">시간별 예보</CardTitle>
      </CardHeader>
      <CardContent>
        {/* 가로 스크롤 컨테이너 */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {forecasts.map((item) => {
            // "YYYY-MM-DD HH:mm:ss" -> "HH시"
            const hour = item.time.slice(11, 13);
            const WeatherIcon = getWeatherIcon(item.iconCode);
            const iconColor = getWeatherIconColor(item.iconCode);

            return (
              <div
                key={item.time}
                className="flex min-w-[72px] flex-col items-center gap-2 rounded-lg p-3"
              >
                <span className="text-muted-foreground font-mono text-xs">
                  {hour}시
                </span>
                <WeatherIcon
                  className={`h-6 w-6 ${iconColor}`}
                  strokeWidth={1.5}
                />
                <span className="font-semibold">{item.temp}°</span>
                {item.precipProb > 0 && (
                  <span className="text-muted-foreground flex items-center gap-0.5 text-xs">
                    <Droplets className="h-3 w-3 text-blue-400" />
                    {Math.round(item.precipProb * 100)}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

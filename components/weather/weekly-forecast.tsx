import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyForecast as DailyForecastType } from "@/lib/weather/api";
import { getWeatherIcon, getWeatherIconColor } from "@/lib/weather/icons";

interface WeeklyForecastProps {
  forecasts: DailyForecastType[];
}

/** 한국어 요일 배열 */
const KO_DAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

/**
 * 주간 예보 컴포넌트 (일별, 최대 5일)
 * Server Component - 데이터를 props로 받아 렌더링
 */
export function WeeklyForecast({ forecasts }: WeeklyForecastProps) {
  if (forecasts.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">주간 예보</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-border divide-y">
          {forecasts.map((item, index) => {
            // "YYYY-MM-DD" -> 날짜 파싱
            const [year, month, day] = item.date.split("-").map(Number);
            const date = new Date(year, month - 1, day);
            const dayName = KO_DAYS[date.getDay()];
            const isToday = index === 0;

            const WeatherIcon = getWeatherIcon(item.iconCode);
            const iconColor = getWeatherIconColor(item.iconCode);

            return (
              <div
                key={item.date}
                className="flex items-center justify-between py-3"
              >
                {/* 날짜 */}
                <div className="w-16">
                  <span
                    className={`text-sm font-medium ${
                      isToday ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {isToday ? "오늘" : `${month}/${day} (${dayName})`}
                  </span>
                </div>

                {/* 날씨 아이콘 + 설명 */}
                <div className="flex flex-1 items-center gap-2 px-4">
                  <WeatherIcon
                    className={`h-5 w-5 shrink-0 ${iconColor}`}
                    strokeWidth={1.5}
                  />
                  <span className="text-muted-foreground truncate text-sm">
                    {item.description}
                  </span>
                </div>

                {/* 최저/최고 온도 */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground font-mono">
                    {item.tempMin}°
                  </span>
                  <span className="text-foreground font-mono font-semibold">
                    {item.tempMax}°
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

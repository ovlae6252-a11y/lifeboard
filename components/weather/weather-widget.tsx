import { Suspense } from "react";
import Link from "next/link";
import { MapPin, Droplets, Wind } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentWeather } from "@/lib/weather/api";
import { getLocationCoords, DEFAULT_LOCATION } from "@/lib/weather/locations";
import { getWeatherIcon, getWeatherIconColor } from "@/lib/weather/icons";

interface WeatherWidgetProps {
  /** 표시할 위치명 (예: "서울", "부산"). 미입력 시 기본 위치 사용 */
  location?: string;
}

/** 로딩 중 스켈레톤 UI */
function WeatherWidgetSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-12 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-14 w-14 rounded-full" />
      </CardContent>
    </Card>
  );
}

/** 날씨 데이터 페칭 + 렌더링 (Server Component) */
async function WeatherWidgetContent({
  location = DEFAULT_LOCATION,
}: WeatherWidgetProps) {
  // API 키 미설정 시 조용히 숨김
  if (!process.env.WEATHER_API_KEY) {
    return null;
  }

  const locationName = location || DEFAULT_LOCATION;
  const { lat, lon } = getLocationCoords(locationName);

  let weather;
  try {
    weather = await getCurrentWeather(lat, lon);
  } catch {
    // API 호출 실패 시 안내 UI 반환
    return (
      <Card>
        <CardContent className="p-5 text-center">
          <p className="text-muted-foreground text-sm">
            날씨 정보를 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.
          </p>
        </CardContent>
      </Card>
    );
  }

  const WeatherIcon = getWeatherIcon(weather.iconCode);
  const iconColor = getWeatherIconColor(weather.iconCode);

  return (
    <Link href="/protected/weather" className="block">
      <Card className="hover:border-primary/30 transition-all hover:shadow-md">
        <CardContent className="flex items-center justify-between gap-4 p-5">
          {/* 왼쪽: 위치 + 기온 */}
          <div className="flex flex-col gap-1">
            <div className="text-muted-foreground flex items-center gap-1 text-xs">
              <MapPin className="h-3 w-3" />
              <span>{locationName}</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="font-serif text-5xl font-bold tracking-tight">
                {weather.temp}°
              </span>
              <div className="text-muted-foreground mb-1 text-sm">
                <span>{weather.tempMax}°</span>
                <span className="mx-1">/</span>
                <span>{weather.tempMin}°</span>
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              {weather.description}
            </p>
          </div>

          {/* 오른쪽: 아이콘 + 부가 정보 */}
          <div className="flex flex-col items-end gap-2">
            <WeatherIcon
              className={`h-14 w-14 ${iconColor}`}
              strokeWidth={1.5}
            />
            <div className="text-muted-foreground flex flex-col items-end gap-1 text-xs">
              <span className="flex items-center gap-1">
                <Droplets className="h-3 w-3" />
                습도 {weather.humidity}%
              </span>
              <span className="flex items-center gap-1">
                <Wind className="h-3 w-3" />
                {weather.windSpeed}m/s
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

/** 대시보드용 날씨 위젯. Suspense로 스켈레톤 로딩 처리. */
export function WeatherWidget({
  location = DEFAULT_LOCATION,
}: WeatherWidgetProps) {
  return (
    <Suspense fallback={<WeatherWidgetSkeleton />}>
      <WeatherWidgetContent location={location} />
    </Suspense>
  );
}

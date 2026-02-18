import { Suspense } from "react";
import type { Metadata } from "next";
import { MapPin, Droplets, Wind, Thermometer } from "lucide-react";
import { redirect } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HourlyForecast } from "@/components/weather/hourly-forecast";
import { WeeklyForecast } from "@/components/weather/weekly-forecast";
import { getWeatherIcon, getWeatherIconColor } from "@/lib/weather/icons";
import {
  getCurrentWeather,
  getHourlyForecast,
  getWeeklyForecast,
} from "@/lib/weather/api";
import { getLocationCoords, DEFAULT_LOCATION } from "@/lib/weather/locations";
import { createClient } from "@/lib/supabase/server";
import { getUserPreferences } from "@/lib/user/preferences";

export const metadata: Metadata = {
  title: "날씨 | Lifeboard",
  description: "현재 날씨와 예보를 확인합니다",
};

function WeatherLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Skeleton className="h-8 w-24" />
        <Skeleton className="mt-1 h-4 w-48" />
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

async function WeatherContent() {
  // API 키 미설정 시 안내 UI 반환
  if (!process.env.WEATHER_API_KEY) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-muted-foreground text-sm">
              날씨 서비스를 이용하려면 관리자가 WEATHER_API_KEY를 설정해야
              합니다.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 사용자 위치 설정 조회
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/auth/login");
  }

  const prefs = await getUserPreferences(data.claims.sub);
  const locationName = prefs.weather_location || DEFAULT_LOCATION;
  const { lat, lon } = getLocationCoords(locationName);

  // 병렬 데이터 페칭
  const [current, hourly, weekly] = await Promise.all([
    getCurrentWeather(lat, lon),
    getHourlyForecast(lat, lon),
    getWeeklyForecast(lat, lon),
  ]);

  const WeatherIcon = getWeatherIcon(current.iconCode);
  const iconColor = getWeatherIconColor(current.iconCode);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">날씨</h1>
        <p className="text-muted-foreground mt-1 flex items-center gap-1 text-sm">
          <MapPin className="h-3.5 w-3.5" />
          {locationName} 날씨 정보
        </p>
      </div>

      {/* 현재 날씨 카드 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            {/* 기온 및 날씨 상태 */}
            <div className="space-y-1">
              <div className="flex items-end gap-3">
                <span className="font-serif text-7xl font-bold tracking-tight">
                  {current.temp}°
                </span>
                <div className="text-muted-foreground mb-2 text-lg">C</div>
              </div>
              <p className="text-foreground text-lg font-medium">
                {current.description}
              </p>
              <p className="text-muted-foreground text-sm">
                최고 {current.tempMax}° / 최저 {current.tempMin}°
              </p>
            </div>

            {/* 날씨 아이콘 */}
            <WeatherIcon
              className={`h-20 w-20 ${iconColor}`}
              strokeWidth={1.2}
            />
          </div>

          {/* 부가 정보 */}
          <div className="border-border mt-6 grid grid-cols-3 gap-4 border-t pt-5">
            <div className="flex flex-col items-center gap-1">
              <Thermometer className="text-muted-foreground h-5 w-5" />
              <span className="text-muted-foreground text-xs">체감온도</span>
              <span className="font-semibold">{current.feelsLike}°</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Droplets className="text-muted-foreground h-5 w-5" />
              <span className="text-muted-foreground text-xs">습도</span>
              <span className="font-semibold">{current.humidity}%</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Wind className="text-muted-foreground h-5 w-5" />
              <span className="text-muted-foreground text-xs">풍속</span>
              <span className="font-semibold">{current.windSpeed}m/s</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 시간별 예보 */}
      <HourlyForecast forecasts={hourly} />

      {/* 주간 예보 */}
      <WeeklyForecast forecasts={weekly} />
    </div>
  );
}

export default function WeatherPage() {
  return (
    <Suspense fallback={<WeatherLoading />}>
      <WeatherContent />
    </Suspense>
  );
}

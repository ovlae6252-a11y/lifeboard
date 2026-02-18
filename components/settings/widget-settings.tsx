"use client";

import { useEffect, useState } from "react";
import { Newspaper, CloudSun, MapPin } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LOCATION_NAMES } from "@/lib/weather/locations";

interface DashboardConfig {
  showNews: boolean;
  showWeather: boolean;
}

const DEFAULT_CONFIG: DashboardConfig = {
  showNews: true,
  showWeather: true,
};

/**
 * 대시보드 위젯 표시/숨김 + 날씨 위치 설정 컴포넌트
 * Client Component - API를 통해 설정을 조회하고 업데이트
 */
export function WidgetSettings() {
  const [config, setConfig] = useState<DashboardConfig>(DEFAULT_CONFIG);
  const [weatherLocation, setWeatherLocation] = useState("서울");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/preferences")
      .then((res) => res.json())
      .then((data) => {
        const dashboardConfig = data?.preferences?.dashboard_config as
          | Partial<DashboardConfig>
          | undefined;
        setConfig({
          showNews: dashboardConfig?.showNews !== false,
          showWeather: dashboardConfig?.showWeather !== false,
        });
        setWeatherLocation(data?.preferences?.weather_location || "서울");
      })
      .catch(() => {
        // 조회 실패 시 기본값 사용
      })
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (key: keyof DashboardConfig, value: boolean) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);

    try {
      const res = await fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dashboard_config: newConfig }),
      });

      if (!res.ok) throw new Error();
      toast.success("설정이 저장되었습니다");
    } catch {
      setConfig(config);
      toast.error("설정 저장에 실패했습니다");
    }
  };

  const handleLocationChange = async (value: string) => {
    const prev = weatherLocation;
    setWeatherLocation(value);

    try {
      const res = await fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weather_location: value }),
      });

      if (!res.ok) throw new Error();
      toast.success("날씨 위치가 저장되었습니다");
    } catch {
      setWeatherLocation(prev);
      toast.error("설정 저장에 실패했습니다");
    }
  };

  const widgets = [
    {
      key: "showNews" as const,
      label: "뉴스 위젯",
      description: "대시보드에 최신 뉴스를 표시합니다",
      icon: Newspaper,
    },
    {
      key: "showWeather" as const,
      label: "날씨 위젯",
      description: "대시보드에 현재 날씨를 표시합니다",
      icon: CloudSun,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">대시보드 위젯</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* 위젯 표시/숨김 스위치 */}
        {widgets.map(({ key, label, description, icon: Icon }) => (
          <div key={key} className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Icon className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
              <div className="space-y-0.5">
                <Label htmlFor={key} className="cursor-pointer font-medium">
                  {label}
                </Label>
                <p className="text-muted-foreground text-sm">{description}</p>
              </div>
            </div>
            <Switch
              id={key}
              checked={loading ? true : config[key]}
              disabled={loading}
              onCheckedChange={(value) => handleToggle(key, value)}
            />
          </div>
        ))}

        {/* 날씨 위치 선택 */}
        <div className="border-border border-t pt-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <MapPin className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
              <div className="space-y-0.5">
                <Label className="font-medium">날씨 위치</Label>
                <p className="text-muted-foreground text-sm">
                  날씨 위젯에 표시할 지역을 선택합니다
                </p>
              </div>
            </div>
            <Select
              value={weatherLocation}
              onValueChange={handleLocationChange}
              disabled={loading}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOCATION_NAMES.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { findNearestLocation, LOCATION_NAMES } from "@/lib/weather/locations";

interface WeatherLocationSelectProps {
  /** 현재 저장된 위치명 */
  currentLocation: string;
}

/**
 * 날씨 위치 선택 드롭다운 컴포넌트.
 * 브라우저 Geolocation 자동 추천 기능 포함.
 * Client Component.
 */
export function WeatherLocationSelect({
  currentLocation,
}: WeatherLocationSelectProps) {
  const router = useRouter();
  const [location, setLocation] = useState(currentLocation);

  // Geolocation 자동 추천: 현재 위치와 다르면 toast 알림
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nearest = findNearestLocation(coords.latitude, coords.longitude);
        if (nearest !== location) {
          toast.info(
            `현재 위치 기반으로 '${nearest}'(으)로 변경하시겠습니까?`,
            {
              action: {
                label: "변경",
                onClick: () => handleChange(nearest),
              },
              duration: 8000,
            },
          );
        }
      },
      // 권한 거부 또는 오류 시 조용히 무시
      () => {},
    );
    // 마운트 시 1회만 실행
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = async (value: string) => {
    const prev = location;
    setLocation(value);

    try {
      const res = await fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weather_location: value }),
      });

      if (!res.ok) throw new Error();

      toast.success("날씨 위치가 저장되었습니다");
      router.refresh();
    } catch {
      setLocation(prev);
      toast.error("위치 저장에 실패했습니다");
    }
  };

  return (
    <Select value={location} onValueChange={handleChange}>
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
  );
}

import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  Moon,
  Sun,
  Wind,
  type LucideIcon,
} from "lucide-react";

/**
 * OpenWeatherMap 아이콘 코드 -> lucide-react 아이콘 매핑
 * https://openweathermap.org/weather-conditions
 */
const ICON_MAP: Record<string, LucideIcon> = {
  // 맑음
  "01d": Sun,
  "01n": Moon,
  // 구름 조금
  "02d": Cloud,
  "02n": CloudMoon,
  // 구름 많음
  "03d": Cloud,
  "03n": Cloud,
  // 흐림
  "04d": Cloud,
  "04n": Cloud,
  // 이슬비
  "09d": CloudDrizzle,
  "09n": CloudDrizzle,
  // 비
  "10d": CloudRain,
  "10n": CloudRain,
  // 천둥번개
  "11d": CloudLightning,
  "11n": CloudLightning,
  // 눈
  "13d": CloudSnow,
  "13n": CloudSnow,
  // 안개/연무
  "50d": CloudFog,
  "50n": CloudFog,
};

/**
 * 아이콘 코드에 해당하는 lucide-react 아이콘 컴포넌트 반환
 * 매핑되지 않는 코드는 Wind 아이콘으로 폴백
 */
export function getWeatherIcon(iconCode: string): LucideIcon {
  return ICON_MAP[iconCode] ?? Wind;
}

/**
 * 날씨 아이콘 코드에 따른 색상 클래스 반환
 */
export function getWeatherIconColor(iconCode: string): string {
  if (iconCode === "01n") return "text-indigo-300"; // 맑은 밤
  if (iconCode === "02n") return "text-slate-400"; // 구름 조금인 밤
  if (iconCode.startsWith("01")) return "text-amber-400"; // 맑음 (낮)
  if (iconCode.startsWith("02") || iconCode.startsWith("03"))
    return "text-slate-400"; // 구름 조금/많음
  if (iconCode.startsWith("04")) return "text-slate-500"; // 흐림
  if (iconCode.startsWith("09") || iconCode.startsWith("10"))
    return "text-blue-400"; // 비
  if (iconCode.startsWith("11")) return "text-purple-400"; // 천둥번개
  if (iconCode.startsWith("13")) return "text-sky-300"; // 눈
  if (iconCode.startsWith("50")) return "text-slate-300"; // 안개
  return "text-slate-400";
}

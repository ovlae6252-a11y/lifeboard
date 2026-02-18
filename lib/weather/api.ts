import { cacheLife } from "next/cache";

// --- 타입 정의 ---

/** 현재 날씨 데이터 */
export interface CurrentWeather {
  /** 현재 온도 (°C) */
  temp: number;
  /** 체감 온도 (°C) */
  feelsLike: number;
  /** 최저 온도 (°C) */
  tempMin: number;
  /** 최고 온도 (°C) */
  tempMax: number;
  /** 날씨 상태 코드 (OpenWeatherMap 기준) */
  weatherCode: number;
  /** 아이콘 코드 (예: "01d", "10n") */
  iconCode: string;
  /** 날씨 설명 (한국어) */
  description: string;
  /** 습도 (%) */
  humidity: number;
  /** 풍속 (m/s) */
  windSpeed: number;
  /** 강수확률 (0~1, forecast 없으면 0) */
  precipProb: number;
}

/** 시간별 예보 항목 */
export interface HourlyForecast {
  /** ISO 시간 문자열 */
  time: string;
  /** 온도 (°C) */
  temp: number;
  /** 아이콘 코드 */
  iconCode: string;
  /** 날씨 설명 */
  description: string;
  /** 강수확률 (0~1) */
  precipProb: number;
}

/** 일별 예보 항목 */
export interface DailyForecast {
  /** 날짜 (YYYY-MM-DD) */
  date: string;
  /** 최저 온도 (°C) */
  tempMin: number;
  /** 최고 온도 (°C) */
  tempMax: number;
  /** 아이콘 코드 */
  iconCode: string;
  /** 날씨 설명 */
  description: string;
}

// --- 내부 헬퍼 ---

function getApiKey(): string {
  const key = process.env.WEATHER_API_KEY;
  if (!key) {
    throw new Error("WEATHER_API_KEY 환경변수가 설정되지 않았습니다");
  }
  return key;
}

// --- 쿼리 함수 ---

/**
 * 현재 날씨 조회
 * OpenWeatherMap /data/2.5/weather 사용 (Free tier)
 */
export async function getCurrentWeather(
  lat: number,
  lon: number,
): Promise<CurrentWeather> {
  "use cache";
  cacheLife({ revalidate: 1800 }); // 30분 캐시

  const apiKey = getApiKey();
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=kr`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`날씨 데이터 조회 실패: ${res.status}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json();

  return {
    temp: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    tempMin: Math.round(data.main.temp_min),
    tempMax: Math.round(data.main.temp_max),
    weatherCode: data.weather[0].id,
    iconCode: data.weather[0].icon,
    description: data.weather[0].description,
    humidity: data.main.humidity,
    windSpeed: data.wind.speed,
    precipProb: 0, // current weather API는 강수확률 미제공
  };
}

/**
 * 시간별 예보 조회 (3시간 간격, 최대 8개 = 24시간)
 * OpenWeatherMap /data/2.5/forecast 사용 (Free tier)
 */
export async function getHourlyForecast(
  lat: number,
  lon: number,
): Promise<HourlyForecast[]> {
  "use cache";
  cacheLife({ revalidate: 1800 }); // 30분 캐시

  const apiKey = getApiKey();
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=kr&cnt=8`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`시간별 예보 조회 실패: ${res.status}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.list ?? []).map(
    (item: any): HourlyForecast => ({
      time: item.dt_txt, // "YYYY-MM-DD HH:mm:ss"
      temp: Math.round(item.main.temp),
      iconCode: item.weather[0].icon,
      description: item.weather[0].description,
      precipProb: Math.round((item.pop ?? 0) * 100) / 100,
    }),
  );
}

/**
 * 주간 예보 조회 (일별 집계, 최대 5일)
 * OpenWeatherMap /data/2.5/forecast 사용 (Free tier)
 * 하루 8개(3시간 간격) 데이터를 날짜별 최고/최저로 집계
 */
export async function getWeeklyForecast(
  lat: number,
  lon: number,
): Promise<DailyForecast[]> {
  "use cache";
  cacheLife({ revalidate: 1800 }); // 30분 캐시

  const apiKey = getApiKey();
  // cnt=40: 5일 * 8개(3시간 간격)
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=kr&cnt=40`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`주간 예보 조회 실패: ${res.status}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json();

  // 날짜별 집계 맵
  const dailyMap: Record<
    string,
    { temps: number[]; iconCode: string; description: string }
  > = {};

  for (const item of data.list ?? []) {
    const date = (item.dt_txt as string).slice(0, 10); // YYYY-MM-DD
    if (!dailyMap[date]) {
      dailyMap[date] = {
        temps: [],
        iconCode: item.weather[0].icon,
        description: item.weather[0].description,
      };
    }
    dailyMap[date].temps.push(Math.round(item.main.temp));
    // 낮 시간대(12시) 날씨 정보로 대표값 설정
    if (item.dt_txt.includes("12:00:00")) {
      dailyMap[date].iconCode = item.weather[0].icon;
      dailyMap[date].description = item.weather[0].description;
    }
  }

  // 날짜 정렬 후 DailyForecast 배열 반환
  return Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([date, { temps, iconCode, description }]): DailyForecast => ({
        date,
        tempMin: Math.min(...temps),
        tempMax: Math.max(...temps),
        iconCode,
        description,
      }),
    );
}

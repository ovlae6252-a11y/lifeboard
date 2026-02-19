/** 위치 좌표 타입 */
export interface LocationCoords {
  lat: number;
  lon: number;
}

/** 한국 주요 시/도 위경도 매핑 */
export const LOCATIONS: Record<string, LocationCoords> = {
  서울: { lat: 37.5665, lon: 126.978 },
  부산: { lat: 35.1796, lon: 129.0756 },
  대구: { lat: 35.8714, lon: 128.6014 },
  인천: { lat: 37.4563, lon: 126.7052 },
  광주: { lat: 35.1595, lon: 126.8526 },
  대전: { lat: 36.3504, lon: 127.3845 },
  울산: { lat: 35.5384, lon: 129.3114 },
  세종: { lat: 36.48, lon: 127.289 },
  경기: { lat: 37.4138, lon: 127.5183 },
  강원: { lat: 37.8228, lon: 128.1555 },
  충북: { lat: 36.6357, lon: 127.4913 },
  충남: { lat: 36.5184, lon: 126.8 },
  전북: { lat: 35.7175, lon: 127.153 },
  전남: { lat: 34.8679, lon: 126.991 },
  경북: { lat: 36.4919, lon: 128.8889 },
  경남: { lat: 35.4606, lon: 128.2132 },
  제주: { lat: 33.4996, lon: 126.5312 },
};

/** 기본 위치 */
export const DEFAULT_LOCATION = "서울";

/**
 * 위치명에 해당하는 좌표 반환
 * 없는 위치명이면 서울 기본값 반환
 */
export function getLocationCoords(name: string): LocationCoords {
  return LOCATIONS[name] ?? LOCATIONS[DEFAULT_LOCATION];
}

/** 지원하는 위치명 목록 */
export const LOCATION_NAMES = Object.keys(LOCATIONS);

/**
 * 두 좌표 사이의 Haversine 거리를 계산한다 (km 단위).
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * 브라우저 Geolocation 좌표를 받아 가장 가까운 시/도 이름을 반환한다.
 */
export function findNearestLocation(lat: number, lon: number): string {
  let nearest = DEFAULT_LOCATION;
  let minDistance = Infinity;

  for (const [name, coords] of Object.entries(LOCATIONS)) {
    const distance = haversineDistance(lat, lon, coords.lat, coords.lon);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = name;
    }
  }

  return nearest;
}

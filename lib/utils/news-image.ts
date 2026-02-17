/**
 * Hotlink 방지가 있는 도메인 목록
 * 이 도메인들의 이미지는 API Route 프록시를 통해 가져옵니다.
 * 한국 주요 언론사는 대부분 Referer 검증을 하므로 전체 프록시 처리합니다.
 */
const PROXY_REQUIRED_DOMAINS = [
  "yna.co.kr", // 연합뉴스
  "yonhapnews.co.kr", // 연합뉴스 (구 도메인)
  "chosun.com", // 조선일보
  "hani.co.kr", // 한겨레
  "sbs.co.kr", // SBS
  "jtbc.co.kr", // JTBC
  "hankyung.com", // 한국경제
  "mk.co.kr", // 매일경제
  "khan.co.kr", // 경향신문
  "sedaily.com", // 서울경제
  "joins.com", // 중앙일보 (구 도메인)
  "joongang.co.kr", // 중앙일보
  "seoul.co.kr", // 서울신문
  "kbs.co.kr", // KBS
  "imbc.com", // MBC
  "donga.com", // 동아일보
  "etnews.com", // 전자신문
  "zdnet.co.kr", // ZDNet Korea
];

/**
 * 뉴스 이미지 URL 폴백 유틸리티.
 * RSS에서 제공된 image_url이 있으면 우선 사용하고,
 * Hotlink 방지가 있는 도메인은 프록시 경로로 변환합니다.
 * 없으면 null을 반환하여 CategoryGradient 컴포넌트로 폴백하도록 한다.
 */
export function getNewsImageUrl(imageUrl: string | null): string | null {
  // 이미지가 없으면 null 반환 (CategoryGradient로 폴백)
  if (!imageUrl || imageUrl.trim().length === 0) {
    return null;
  }

  // URL 유효성 검사
  try {
    const url = new URL(imageUrl);

    // Hotlink 방지가 있는 도메인인지 확인
    const requiresProxy = PROXY_REQUIRED_DOMAINS.some((domain) =>
      url.hostname.endsWith(domain),
    );

    if (requiresProxy) {
      // API Route 프록시를 통해 이미지 가져오기
      return `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`;
    }

    // 일반 도메인은 그대로 반환
    return imageUrl;
  } catch {
    // URL 파싱 실패 시 null 반환
    return null;
  }
}

/**
 * 이미지 URL이 유효한지 검증한다.
 */
export function isValidImageUrl(imageUrl: string | null): boolean {
  if (!imageUrl || imageUrl.trim().length === 0) {
    return false;
  }

  try {
    const url = new URL(imageUrl);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

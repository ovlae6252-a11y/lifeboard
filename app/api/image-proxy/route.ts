import { type NextRequest } from "next/server";

/**
 * 외부 이미지 프록시 API
 *
 * Hotlink 방지가 설정된 언론사 이미지를 서버에서 가져와 전달합니다.
 * 주로 연합뉴스(*.yna.co.kr) 등 Referer 검증이 있는 이미지에 사용됩니다.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const imageUrl = searchParams.get("url");

  // URL 파라미터 검증
  if (!imageUrl) {
    return new Response("Missing url parameter", { status: 400 });
  }

  // 허용된 도메인만 프록시 (보안)
  const allowedDomains = [
    "yna.co.kr",
    "yonhapnews.co.kr",
    "joins.com",
    "chosun.com",
    "donga.com",
    "hani.co.kr",
    "khan.co.kr",
    "hankyung.com",
    "mk.co.kr",
    "sedaily.com",
    "etnews.com",
    "zdnet.co.kr",
    "sbs.co.kr",
    "jtbc.co.kr",
    "kbs.co.kr",
    "imbc.com",
    "seoul.co.kr",
    "joongang.co.kr",
  ];

  const url = new URL(imageUrl);
  const isAllowed = allowedDomains.some((domain) =>
    url.hostname.endsWith(domain),
  );

  if (!isAllowed) {
    return new Response("Domain not allowed", { status: 403 });
  }

  try {
    // 이미지 가져오기 (Referer 헤더로 우회)
    const response = await fetch(imageUrl, {
      headers: {
        // 일반 브라우저로 위장
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        // 각 언론사 도메인을 Referer로 설정
        Referer: `https://${url.hostname}/`,
        Accept:
          "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
      // 타임아웃 설정 (10초)
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error(
        `[image-proxy] Failed to fetch image: ${imageUrl}, status: ${response.status}`,
      );
      return new Response("Failed to fetch image", { status: 502 });
    }

    // 이미지 응답 전달
    const contentType = response.headers.get("Content-Type") || "image/jpeg";
    const imageBuffer = await response.arrayBuffer();

    return new Response(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // 캐싱 설정 (1일)
        "Cache-Control": "public, max-age=86400, immutable",
        // CORS 허용 (클라이언트에서 접근 가능)
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("[image-proxy] Error fetching image:", error);

    // 타임아웃 에러
    if (error instanceof Error && error.name === "TimeoutError") {
      return new Response("Image fetch timeout", { status: 504 });
    }

    return new Response("Internal server error", { status: 500 });
  }
}

// OPTIONS 요청 처리 (CORS preflight)
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

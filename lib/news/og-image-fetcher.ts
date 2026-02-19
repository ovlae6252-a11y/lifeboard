import * as cheerio from "cheerio";

const TIMEOUT_MS = 5000; // 5초 타임아웃
const MAX_RETRIES = 2; // 최대 2회 재시도
// 봇 차단 우회를 위해 브라우저 유사 User-Agent 사용
const OG_USER_AGENT =
  "Mozilla/5.0 (compatible; Lifeboard/1.0; +https://lifeboard-omega.vercel.app)";

/**
 * URL에서 Open Graph 이미지 URL을 추출합니다.
 * 타임아웃 5초, 실패 시 null 반환 (에러 발생시켜서 전체 수집 중단하지 않음)
 */
export async function fetchOgImage(url: string): Promise<string | null> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": OG_USER_AGENT,
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        console.warn(
          `[OG 이미지] HTTP ${response.status} - ${url} (${attempt}/${MAX_RETRIES})`,
        );
        if (attempt === MAX_RETRIES) return null;
        continue;
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Open Graph 이미지 추출 (우선순위 순)
      const ogImage =
        $('meta[property="og:image"]').attr("content") ||
        $('meta[property="og:image:url"]').attr("content") ||
        $('meta[name="twitter:image"]').attr("content");

      if (ogImage && isValidImageUrl(ogImage)) {
        return ogImage;
      }

      return null;
    } catch (error) {
      if (attempt === MAX_RETRIES) {
        console.warn(
          `[OG 이미지] 파싱 실패 - ${url}: ${error instanceof Error ? error.message : String(error)}`,
        );
        return null;
      }
      // 재시도
      await sleep(500);
    }
  }

  return null;
}

/**
 * 여러 URL에서 OG 이미지를 병렬로 추출합니다.
 * 배치 크기만큼씩 처리하여 과도한 동시 요청 방지
 */
export async function fetchOgImagesBatch(
  urls: string[],
  batchSize: number = 10,
): Promise<Map<string, string | null>> {
  const results = new Map<string, string | null>();

  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const promises = batch.map(async (url) => {
      const imageUrl = await fetchOgImage(url);
      return { url, imageUrl };
    });

    const batchResults = await Promise.all(promises);
    batchResults.forEach(({ url, imageUrl }) => {
      results.set(url, imageUrl);
    });

    // 배치 간 짧은 대기 (서버 부하 방지)
    if (i + batchSize < urls.length) {
      await sleep(200);
    }
  }

  return results;
}

function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      // 너무 작은 이미지 제외 (1x1 트래킹 픽셀 등)
      !url.includes("1x1") &&
      !url.includes("pixel")
    );
  } catch {
    return false;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

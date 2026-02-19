import Parser from "rss-parser";
import type { RawArticle, ArticleInsert, NewsSource } from "./types";
import { normalizeTitle } from "./normalize-title";
import {
  classifyFromRssCategories,
  classifyFromTitle,
} from "./category-classifier";

const parser = new Parser({
  timeout: 5000,
  headers: {
    "User-Agent": "Lifeboard/1.0 (RSS Reader)",
  },
  customFields: {
    item: [
      ["media:content", "media:content", { keepArray: false }],
      ["media:thumbnail", "media:thumbnail", { keepArray: false }],
    ],
  },
});

// 단일 RSS 피드에서 기사 목록 파싱
export async function fetchRssFeed(feedUrl: string): Promise<RawArticle[]> {
  const feed = await parser.parseURL(feedUrl);

  return (feed.items ?? []).map((item) => ({
    guid: item.guid || item.link || item.title || "",
    title: item.title || "",
    link: item.link || "",
    description:
      item.contentSnippet || item.content || item.summary || undefined,
    author:
      item.creator ||
      (item as unknown as Record<string, string>).author ||
      undefined,
    pubDate: item.pubDate || item.isoDate || undefined,
    categories: item.categories,
    imageUrl: extractImageUrl(item),
  }));
}

// 날짜 문자열을 안전하게 ISO 문자열로 변환 (유효하지 않으면 null 반환)
function safeParseDate(dateStr: string): string | null {
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date.toISOString();
  } catch {
    return null;
  }
}

// URL이 http/https 프로토콜인지 검증
function isValidHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// RSS 아이템에서 이미지 URL 추출 (4단계 우선순위)
function extractImageUrl(item: Parser.Item): string | undefined {
  const media = item as Record<string, unknown>;

  // 1) media:content (customFields로 파싱된 RSS 확장 필드)
  try {
    const mc = media["media:content"] as Record<string, Record<string, string>>;
    const url = mc?.["$"]?.url;
    if (typeof url === "string" && isValidHttpUrl(url)) return url;
  } catch {
    // 구조가 다를 수 있으므로 무시
  }

  // 2) media:thumbnail
  try {
    const mt = media["media:thumbnail"] as Record<
      string,
      Record<string, string>
    >;
    const url = mt?.["$"]?.url;
    if (typeof url === "string" && isValidHttpUrl(url)) return url;
  } catch {
    // 구조가 다를 수 있으므로 무시
  }

  // 3) enclosure (type 조건 완화: MIME type 또는 URL 확장자로 판별)
  if (item.enclosure?.url && isValidHttpUrl(item.enclosure.url)) {
    if (
      item.enclosure.type?.startsWith("image/") ||
      /\.(jpe?g|png|gif|webp|avif)/i.test(item.enclosure.url)
    ) {
      return item.enclosure.url;
    }
  }

  // 4) description HTML 내 <img> 태그에서 추출
  const html = (item.content as string | undefined) ?? "";
  if (html) {
    const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match?.[1] && isValidHttpUrl(match[1])) return match[1];
  }

  return undefined;
}

// RawArticle → ArticleInsert 변환
export function toArticleInserts(
  rawArticles: RawArticle[],
  source: NewsSource,
): ArticleInsert[] {
  return rawArticles
    .filter(
      (raw) => raw.guid && raw.title && raw.link && isValidHttpUrl(raw.link),
    )
    .map((raw) => ({
      source_id: source.id,
      guid: raw.guid,
      title: raw.title,
      title_normalized: normalizeTitle(raw.title),
      description: raw.description ?? null,
      original_url: raw.link,
      author: raw.author ?? null,
      // RSS 카테고리 태그 → 제목 키워드 → 소스 기본 카테고리 순서로 분류
      category:
        classifyFromRssCategories(raw.categories) ??
        classifyFromTitle(raw.title) ??
        source.category,
      published_at: raw.pubDate ? safeParseDate(raw.pubDate) : null,
      image_url: raw.imageUrl ?? null,
    }));
}

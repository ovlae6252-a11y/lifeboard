import { createAdminClient } from "@/lib/supabase/admin";

// 콘텐츠 필터 캐시 (메모리 레벨, TTL 10분)
interface FilterCache {
  blacklist: string[];
  whitelist: string[];
  timestamp: number;
}

let filterCache: FilterCache | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10분

/**
 * content_filters 테이블에서 활성 필터 키워드 조회
 * 10분간 메모리 캐싱하여 DB 조회 최소화
 */
async function getActiveFilters(): Promise<FilterCache> {
  const now = Date.now();

  // 캐시 유효성 확인
  if (filterCache && now - filterCache.timestamp < CACHE_TTL_MS) {
    return filterCache;
  }

  // DB에서 활성 필터 조회 (adminClient 사용)
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("content_filters")
    .select("filter_type, keywords")
    .eq("is_active", true);

  if (error) {
    console.error("[필터] content_filters 조회 실패:", error.message);
    // 에러 시 빈 필터 반환 (필터링 건너뜀)
    return { blacklist: [], whitelist: [], timestamp: now };
  }

  // 필터 타입별 키워드 분류
  const blacklist: string[] = [];
  const whitelist: string[] = [];

  for (const row of data || []) {
    if (row.filter_type === "blacklist") {
      blacklist.push(...row.keywords);
    } else if (row.filter_type === "whitelist") {
      whitelist.push(...row.keywords);
    }
  }

  // 캐시 갱신
  filterCache = { blacklist, whitelist, timestamp: now };
  return filterCache;
}

/**
 * 제목 기반 콘텐츠 필터링 (블랙리스트 키워드 검사)
 * @param title 기사 제목
 * @returns true면 필터링 대상 (제외), false면 통과
 */
export async function shouldFilterArticle(title: string): Promise<boolean> {
  if (!title || title.trim().length === 0) {
    return false;
  }

  const filters = await getActiveFilters();

  // 블랙리스트 키워드 포함 여부 확인
  const normalizedTitle = title.toLowerCase();
  for (const keyword of filters.blacklist) {
    if (normalizedTitle.includes(keyword.toLowerCase())) {
      return true; // 필터링 대상
    }
  }

  return false; // 통과
}

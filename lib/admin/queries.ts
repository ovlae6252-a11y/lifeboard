import { cacheLife } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

// --- 타입 정의 ---

export interface SystemStats {
  totalGroups: number;
  validGroups: number;
  invalidSummaries: number;
  todayArticles: number;
  pendingJobs: number;
}

export interface DailyCollectionStat {
  date: string;
  count: number;
}

export interface CategoryStat {
  category: string;
  count: number;
}

export interface FetchLogItem {
  id: string;
  source_id: string;
  status: string;
  articles_new: number;
  filtered_count: number;
  error_message: string | null;
  created_at: string;
}

export interface SummarizeJobItem {
  id: string;
  group_id: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

export interface RecentActivity {
  fetchLogs: FetchLogItem[];
  summarizeJobs: SummarizeJobItem[];
}

// --- 쿼리 함수 ---

/**
 * 시스템 전체 통계 조회
 * 총 그룹 수, 유효 그룹 수, 오늘 수집 기사 수, 대기 요약 작업 수, 유효하지 않은 요약 수
 */
export async function getSystemStats(): Promise<SystemStats> {
  "use cache";
  cacheLife({ revalidate: 900 }); // 15분 캐시

  const admin = createAdminClient();

  // 오늘 자정 기준 ISO 문자열
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartIso = todayStart.toISOString();

  const [totalResult, validResult, invalidResult, todayResult, pendingResult] =
    await Promise.all([
      admin
        .from("news_article_groups")
        .select("id", { count: "exact", head: true }),
      admin
        .from("news_article_groups")
        .select("id", { count: "exact", head: true })
        .eq("is_valid", true),
      admin
        .from("news_article_groups")
        .select("id", { count: "exact", head: true })
        .eq("is_valid", false),
      admin
        .from("news_articles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", todayStartIso),
      admin
        .from("summarize_jobs")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

  return {
    totalGroups: totalResult.count ?? 0,
    validGroups: validResult.count ?? 0,
    invalidSummaries: invalidResult.count ?? 0,
    todayArticles: todayResult.count ?? 0,
    pendingJobs: pendingResult.count ?? 0,
  };
}

/**
 * 일별 기사 수집량 조회 (최근 N일)
 * news_fetch_logs의 articles_new 합계를 날짜별로 집계
 */
export async function getDailyCollectionStats(
  days: number = 7,
): Promise<DailyCollectionStat[]> {
  "use cache";
  cacheLife({ revalidate: 900 });

  const admin = createAdminClient();

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceIso = since.toISOString();

  const { data, error } = await admin
    .from("news_fetch_logs")
    .select("created_at, articles_new")
    .gte("created_at", sinceIso)
    .eq("status", "success");

  if (error) {
    console.error("일별 수집량 조회 실패:", error.message);
    return [];
  }

  // 날짜별(YYYY-MM-DD) 합산
  const dateMap: Record<string, number> = {};
  for (const row of data ?? []) {
    const date = row.created_at.slice(0, 10);
    dateMap[date] = (dateMap[date] ?? 0) + (row.articles_new ?? 0);
  }

  // 최근 N일 날짜 배열 생성 (빈 날짜도 0으로 포함)
  const result: DailyCollectionStat[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    result.push({ date: dateStr, count: dateMap[dateStr] ?? 0 });
  }

  return result;
}

/**
 * 카테고리별 기사 수 분포 조회
 */
export async function getCategoryDistribution(): Promise<CategoryStat[]> {
  "use cache";
  cacheLife({ revalidate: 900 });

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("news_articles")
    .select("category")
    .eq("is_deleted", false);

  if (error) {
    console.error("카테고리 분포 조회 실패:", error.message);
    return [];
  }

  // 카테고리별 카운트 집계
  const catMap: Record<string, number> = {};
  for (const row of data ?? []) {
    catMap[row.category] = (catMap[row.category] ?? 0) + 1;
  }

  return Object.entries(catMap)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * 최근 활동 로그 조회
 * 수집 로그 5건 + 요약 작업 5건
 */
export async function getRecentActivity(): Promise<RecentActivity> {
  "use cache";
  cacheLife({ revalidate: 300 }); // 5분 캐시 (활동 로그는 더 자주 갱신)

  const admin = createAdminClient();

  const [fetchLogsResult, summarizeJobsResult] = await Promise.all([
    admin
      .from("news_fetch_logs")
      .select(
        "id, source_id, status, articles_new, filtered_count, error_message, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(5),
    admin
      .from("summarize_jobs")
      .select("id, group_id, status, error_message, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (fetchLogsResult.error) {
    console.error("수집 로그 조회 실패:", fetchLogsResult.error.message);
  }
  if (summarizeJobsResult.error) {
    console.error("요약 작업 조회 실패:", summarizeJobsResult.error.message);
  }

  return {
    fetchLogs: (fetchLogsResult.data ?? []) as FetchLogItem[],
    summarizeJobs: (summarizeJobsResult.data ?? []) as SummarizeJobItem[],
  };
}

import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchRssFeed, toArticleInserts } from "@/lib/news/rss-fetcher";
import { groupArticles } from "@/lib/news/grouping";
import { logFetchResult, updateLastFetchedAt } from "@/lib/news/fetch-logger";
import { enqueueSummarizeJobs } from "@/lib/news/summarize-queue";
import type {
  NewsSource,
  FetchResult,
  ArticleInsert,
  CollectResponse,
} from "@/lib/news/types";

export const maxDuration = 60;

// CRON_SECRET 검증 (Vercel Cron은 자동으로 Authorization: Bearer <CRON_SECRET> 헤더 포함)
function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || cronSecret.trim() === "") {
    console.error("CRON_SECRET 환경 변수가 설정되지 않았습니다.");
    return false;
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

// 단일 소스에서 기사 수집
async function collectFromSource(
  source: NewsSource,
): Promise<{ result: FetchResult; newArticles: ArticleInsert[] }> {
  try {
    const rawArticles = await fetchRssFeed(source.feed_url);
    const inserts = toArticleInserts(rawArticles, source);

    if (inserts.length === 0) {
      await updateLastFetchedAt(source.id);
      return {
        result: {
          source_id: source.id,
          source_name: source.name,
          status: "success",
          articles_fetched: rawArticles.length,
          articles_new: 0,
        },
        newArticles: [],
      };
    }

    const supabase = createAdminClient();

    // 기존 기사의 guid 조회하여 중복 필터링
    const guids = inserts.map((i) => i.guid);
    const { data: existingArticles } = await supabase
      .from("news_articles")
      .select("guid")
      .eq("source_id", source.id)
      .in("guid", guids);

    const existingGuids = new Set(
      (existingArticles ?? []).map((a) => a.guid),
    );
    const newInserts = inserts.filter((i) => !existingGuids.has(i.guid));

    // 새 기사만 삽입
    if (newInserts.length > 0) {
      const { error: insertError } = await supabase
        .from("news_articles")
        .insert(newInserts);
      if (insertError) {
        throw new Error(`기사 삽입 실패: ${insertError.message}`);
      }
    }

    await updateLastFetchedAt(source.id);

    return {
      result: {
        source_id: source.id,
        source_name: source.name,
        status: "success",
        articles_fetched: rawArticles.length,
        articles_new: newInserts.length,
      },
      newArticles: newInserts,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "알 수 없는 오류";
    console.error(`[RSS 수집 오류] ${source.name}:`, detail);

    return {
      result: {
        source_id: source.id,
        source_name: source.name,
        status: "error",
        articles_fetched: 0,
        articles_new: 0,
        error_message:
          process.env.NODE_ENV === "development"
            ? detail
            : "수집 중 오류가 발생했습니다.",
      },
      newArticles: [],
    };
  }
}

async function handleCollect(request: NextRequest) {
  // 인증 검증
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: "인증되지 않은 요청입니다." },
      { status: 401 },
    );
  }

  const supabase = createAdminClient();

  // 활성 소스 조회
  const { data: sources, error: sourcesError } = await supabase
    .from("news_sources")
    .select("*")
    .eq("is_active", true);

  if (sourcesError || !sources) {
    return NextResponse.json(
      { success: false, error: "뉴스 소스 조회에 실패했습니다." },
      { status: 500 },
    );
  }

  if (sources.length === 0) {
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: [],
      summary: {
        total_sources: 0,
        successful: 0,
        failed: 0,
        total_new_articles: 0,
        new_groups: 0,
      },
    });
  }

  // 소스별 병렬 수집
  const collectResults = await Promise.allSettled(
    sources.map((source: NewsSource) => collectFromSource(source)),
  );

  const fetchResults: FetchResult[] = [];
  const allNewArticles: ArticleInsert[] = [];

  for (const settled of collectResults) {
    if (settled.status === "fulfilled") {
      fetchResults.push(settled.value.result);
      allNewArticles.push(...settled.value.newArticles);
    }
  }

  // 그룹핑
  const groupingResults = await groupArticles(allNewArticles);
  const newGroupIds = groupingResults
    .filter((g) => g.is_new_group)
    .map((g) => g.group_id);

  // 요약 작업 큐 등록
  const enqueuedCount = await enqueueSummarizeJobs(newGroupIds);

  // 수집 로그 기록
  await Promise.allSettled(fetchResults.map((r) => logFetchResult(r)));

  const response: CollectResponse = {
    success: true,
    timestamp: new Date().toISOString(),
    results: fetchResults,
    summary: {
      total_sources: sources.length,
      successful: fetchResults.filter((r) => r.status === "success").length,
      failed: fetchResults.filter((r) => r.status === "error").length,
      total_new_articles: allNewArticles.length,
      new_groups: enqueuedCount,
    },
  };

  return NextResponse.json(response);
}

// Vercel Cron은 GET 호출
export async function GET(request: NextRequest) {
  return handleCollect(request);
}

// 수동 호출용 POST
export async function POST(request: NextRequest) {
  return handleCollect(request);
}

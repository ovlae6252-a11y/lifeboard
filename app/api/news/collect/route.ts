import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import { cleanupOldRecords } from "@/lib/news/cleanup";
import { shouldFilterArticle } from "@/lib/news/content-filter";
import { logFetchResult, updateLastFetchedAt } from "@/lib/news/fetch-logger";
import { groupArticles } from "@/lib/news/grouping";
import { fetchOgImagesBatch } from "@/lib/news/og-image-fetcher";
import { fetchRssFeed, toArticleInserts } from "@/lib/news/rss-fetcher";
import { enqueueSummarizeJobs } from "@/lib/news/summarize-queue";
import type {
  NewsSource,
  FetchResult,
  ArticleInsert,
  CollectResponse,
} from "@/lib/news/types";
import { createAdminClient } from "@/lib/supabase/admin";

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
async function collectFromSource(source: NewsSource): Promise<{
  result: FetchResult;
  newArticles: ArticleInsert[];
  filteredCount: number;
}> {
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
        filteredCount: 0,
      };
    }

    const supabase = createAdminClient();

    // 기존 기사의 guid 조회하여 중복 필터링 (배치 분할로 URL 길이 제한 방지)
    const guids = inserts.map((i) => i.guid);
    const existingGuids = new Set<string>();
    const BATCH_SIZE = 50;

    for (let i = 0; i < guids.length; i += BATCH_SIZE) {
      const batch = guids.slice(i, i + BATCH_SIZE);
      const { data: existingArticles } = await supabase
        .from("news_articles")
        .select("guid")
        .eq("source_id", source.id)
        .in("guid", batch);
      (existingArticles ?? []).forEach((a) => existingGuids.add(a.guid));
    }
    const newInserts = inserts.filter((i) => !existingGuids.has(i.guid));

    // 콘텐츠 필터링 (블랙리스트 키워드 제외)
    const filterChecks = await Promise.all(
      newInserts.map(async (article) => ({
        article,
        shouldFilter: await shouldFilterArticle(article.title),
      })),
    );

    const validInserts = filterChecks
      .filter((check) => !check.shouldFilter)
      .map((check) => check.article);

    const filteredCount = newInserts.length - validInserts.length;

    // OG 이미지 파싱 (이미지가 없는 기사만)
    const articlesWithoutImage = validInserts.filter(
      (article) => !article.image_url,
    );

    if (articlesWithoutImage.length > 0) {
      console.log(
        `[OG 이미지] ${articlesWithoutImage.length}개 기사의 이미지 파싱 시작...`,
      );

      const urls = articlesWithoutImage.map((a) => a.original_url);
      const imageMap = await fetchOgImagesBatch(urls, 10); // 10개씩 배치 처리

      let successCount = 0;
      articlesWithoutImage.forEach((article) => {
        const ogImage = imageMap.get(article.original_url);
        if (ogImage) {
          article.image_url = ogImage;
          successCount++;
        }
      });

      console.log(
        `[OG 이미지] ${successCount}/${articlesWithoutImage.length}개 파싱 성공`,
      );
    }

    // 필터링 통과한 기사만 삽입
    if (validInserts.length > 0) {
      const { error: insertError } = await supabase
        .from("news_articles")
        .insert(validInserts);
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
        articles_new: validInserts.length,
        filtered_count: filteredCount,
      },
      newArticles: validInserts,
      filteredCount,
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
      filteredCount: 0,
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
  let totalFilteredCount = 0;

  for (const settled of collectResults) {
    if (settled.status === "fulfilled") {
      fetchResults.push(settled.value.result);
      allNewArticles.push(...settled.value.newArticles);
      totalFilteredCount += settled.value.filteredCount;
    } else {
      console.error("[RSS 수집] 예상치 못한 오류:", settled.reason);
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

  // 뉴스 캐시 무효화 (use cache 태그 기반)
  revalidateTag("news-groups");
  revalidateTag("news-group-articles");

  // 오래된 데이터 정리 (실패해도 수집 결과에 영향 없음)
  await cleanupOldRecords();

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
      filtered_count: totalFilteredCount,
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

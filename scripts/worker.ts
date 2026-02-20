import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { summarize, validateKoreanContent } from "./summarizer.js";
import { groupArticlesByLLM } from "./llm-grouper.js";
import type { ArticleForSummary } from "./summarizer.js";

// 환경변수 검증
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const REVALIDATE_URL = process.env.REVALIDATE_URL;
const CRON_SECRET = process.env.CRON_SECRET;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "[워커] SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다.",
  );
  console.error("[워커] .env 파일을 확인해주세요. (.env.example 참고)");
  process.exit(1);
}

// Supabase 클라이언트 (service_role - RLS 우회)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// 타임스탬프 포함 로그
function log(...args: unknown[]) {
  const timestamp = new Date().toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
  });
  console.log(`[${timestamp}]`, ...args);
}

// 요약/그룹핑 작업 처리 중 플래그 (각각 독립적으로 병행 처리)
let isSummarizingProcessing = false;
let isGroupingProcessing = false;

// ============================================================
// 요약 작업 처리 (summarize_jobs)
// ============================================================

interface SummarizeJob {
  id: string;
  group_id: string;
  status: string;
}

async function processJob(job: SummarizeJob): Promise<void> {
  log(`[작업] 시작 - job=${job.id}, group=${job.group_id}`);

  // 낙관적 잠금: pending인 경우에만 processing으로 변경
  const { data: locked, error: lockError } = await supabase
    .from("summarize_jobs")
    .update({ status: "processing", started_at: new Date().toISOString() })
    .eq("id", job.id)
    .eq("status", "pending")
    .select();

  if (lockError || !locked || locked.length === 0) {
    log(`[작업] 잠금 실패 (이미 처리 중) - job=${job.id}`);
    return;
  }

  try {
    // 그룹 내 기사 조회
    const { data: articles, error: articlesError } = await supabase
      .from("news_articles")
      .select("title, description")
      .eq("group_id", job.group_id);

    if (articlesError) {
      throw new Error(`기사 조회 실패: ${articlesError.message}`);
    }

    if (!articles || articles.length === 0) {
      throw new Error(`그룹 ${job.group_id}에 기사가 없습니다`);
    }

    log(`[작업] 기사 ${articles.length}개 조회 완료 - group=${job.group_id}`);

    // description이 있는 기사가 하나도 없으면 요약 스킵
    const hasDescription = articles.some((a) => a.description?.trim());
    if (!hasDescription) {
      log(
        `[작업] 스킵 - 모든 기사의 description이 없음 - group=${job.group_id}`,
      );

      // 그룹을 is_summarized=true, is_valid=false로 표시 (요약 불가)
      await supabase
        .from("news_article_groups")
        .update({
          fact_summary: null,
          is_summarized: true,
          summarized_at: new Date().toISOString(),
          is_valid: false,
        })
        .eq("id", job.group_id);

      // 작업 완료 처리
      await supabase
        .from("summarize_jobs")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          error_message: "기사 본문(description) 없음",
        })
        .eq("id", job.id);

      return;
    }

    // Ollama 팩트 요약 생성
    const factSummary = await summarize(articles as ArticleForSummary[]);
    log(`[작업] 요약 생성 완료 - job=${job.id}`);

    // 한국어 비율 검증
    const isValidKorean = validateKoreanContent(factSummary);
    log(
      `[작업] 한국어 검증 ${isValidKorean ? "통과" : "실패"} - job=${job.id}`,
    );

    if (!isValidKorean) {
      log(
        `[작업] 한국어 비율 70% 미만 - 요약 내용: ${factSummary.slice(0, 100)}...`,
      );
    }

    // news_article_groups에 요약 결과 저장
    const { error: updateGroupError } = await supabase
      .from("news_article_groups")
      .update({
        fact_summary: factSummary,
        is_summarized: true,
        summarized_at: new Date().toISOString(),
        is_valid: isValidKorean,
      })
      .eq("id", job.group_id);

    if (updateGroupError) {
      throw new Error(`그룹 업데이트 실패: ${updateGroupError.message}`);
    }

    // 작업 완료 처리
    await supabase
      .from("summarize_jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        error_message: isValidKorean
          ? null
          : "한국어 비율 70% 미만 (검증 실패)",
      })
      .eq("id", job.id);

    log(`[작업] 완료 - job=${job.id}`);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    // 작업 실패 처리 (에러 메시지 500자 제한)
    await supabase
      .from("summarize_jobs")
      .update({
        status: "failed",
        error_message: errorMessage.slice(0, 500),
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    log(`[작업] 실패 - job=${job.id}:`, errorMessage);
  }
}

// Next.js 캐시 무효화 알림 (요약 완료 후 호출, 실패해도 주 작업 중단 없음)
async function notifyRevalidate(): Promise<void> {
  if (!REVALIDATE_URL || !CRON_SECRET) {
    return;
  }

  try {
    const response = await fetch(`${REVALIDATE_URL}/api/news/revalidate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    });
    if (response.ok) {
      log("[캐시] 무효화 완료");
    } else {
      console.error(`[캐시] 무효화 실패 (HTTP ${response.status})`);
    }
  } catch (error) {
    console.error(
      "[캐시] 무효화 요청 오류:",
      error instanceof Error ? error.message : String(error),
    );
  }
}

// pending 요약 작업 폴링
async function pollPendingJobs(): Promise<void> {
  if (isSummarizingProcessing) return;
  isSummarizingProcessing = true;

  try {
    const { data: jobs, error } = await supabase
      .from("summarize_jobs")
      .select("id, group_id, status")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(5);

    if (error) {
      log("[폴링] 작업 조회 실패:", error.message);
      return;
    }

    if (jobs && jobs.length > 0) {
      log(`[폴링] pending 작업 ${jobs.length}개 발견`);
      for (const job of jobs) {
        await processJob(job);
      }
      // 배치 완료 후 Next.js 캐시 무효화 (1회만 호출)
      await notifyRevalidate();
    }
  } catch (error) {
    log(
      "[폴링] 오류:",
      error instanceof Error ? error.message : String(error),
    );
  } finally {
    isSummarizingProcessing = false;
  }
}

// ============================================================
// 그룹핑 작업 처리 (grouping_jobs)
// ============================================================

interface GroupingJob {
  id: string;
  article_ids: string[];
  status: string;
}

async function processGroupingJob(job: GroupingJob): Promise<void> {
  log(
    `[그룹핑] 시작 - job=${job.id.slice(0, 8)}, 기사 ${job.article_ids.length}개`,
  );

  // 낙관적 잠금
  const { data: locked, error: lockError } = await supabase
    .from("grouping_jobs")
    .update({ status: "processing" })
    .eq("id", job.id)
    .eq("status", "pending")
    .select();

  if (lockError || !locked || locked.length === 0) {
    log(`[그룹핑] 잠금 실패 (이미 처리 중) - job=${job.id.slice(0, 8)}`);
    return;
  }

  try {
    await groupArticlesByLLM(job.id, job.article_ids, supabase);

    await supabase
      .from("grouping_jobs")
      .update({
        status: "completed",
        processed_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    log(`[그룹핑] 완료 - job=${job.id.slice(0, 8)}`);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    await supabase
      .from("grouping_jobs")
      .update({
        status: "failed",
        error_message: errorMessage.slice(0, 500),
        processed_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    log(`[그룹핑] 실패 - job=${job.id.slice(0, 8)}:`, errorMessage);
  }
}

// pending 그룹핑 작업 폴링
async function pollGroupingJobs(): Promise<void> {
  if (isGroupingProcessing) return;
  isGroupingProcessing = true;

  try {
    const { data: jobs, error } = await supabase
      .from("grouping_jobs")
      .select("id, article_ids, status")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(3);

    if (error) {
      log("[그룹핑 폴링] 작업 조회 실패:", error.message);
      return;
    }

    if (jobs && jobs.length > 0) {
      log(`[그룹핑 폴링] pending 작업 ${jobs.length}개 발견`);
      for (const job of jobs) {
        await processGroupingJob(job);
      }
    }
  } catch (error) {
    log(
      "[그룹핑 폴링] 오류:",
      error instanceof Error ? error.message : String(error),
    );
  } finally {
    isGroupingProcessing = false;
  }
}

// ============================================================
// 워커 시작
// ============================================================

async function startWorker(): Promise<void> {
  log("========================================");
  log("[워커] Lifeboard 요약/그룹핑 워커 시작");
  log(`[워커] Supabase: ${SUPABASE_URL}`);
  log(
    `[워커] Ollama: ${process.env.OLLAMA_BASE_URL || "http://localhost:11434"}`,
  );
  log(`[워커] 모델: ${process.env.OLLAMA_MODEL || "qwen2.5:14b"}`);
  log("========================================");

  // 시작 시 밀린 작업 처리
  await pollGroupingJobs();
  await pollPendingJobs();

  // Supabase Realtime 구독 (summarize_jobs + grouping_jobs)
  const channel = supabase
    .channel("worker-jobs")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "summarize_jobs",
      },
      async (payload) => {
        log("[Realtime] 새 요약 작업 감지:", payload.new.id);
        if (isSummarizingProcessing) {
          log("[Realtime] 요약 처리 중 - 다음 폴링에서 처리");
          return;
        }
        isSummarizingProcessing = true;
        try {
          await processJob(payload.new as SummarizeJob);
        } finally {
          isSummarizingProcessing = false;
        }
      },
    )
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "grouping_jobs",
      },
      async (payload) => {
        log("[Realtime] 새 그룹핑 작업 감지:", payload.new.id);
        if (isGroupingProcessing) {
          log("[Realtime] 그룹핑 처리 중 - 다음 폴링에서 처리");
          return;
        }
        isGroupingProcessing = true;
        try {
          await processGroupingJob(payload.new as GroupingJob);
        } finally {
          isGroupingProcessing = false;
        }
      },
    )
    .subscribe((status) => {
      log(`[Realtime] 구독 상태: ${status}`);
    });

  // 30초 폴링 폴백 (Realtime 연결 끊김 대비)
  const pollInterval = setInterval(pollPendingJobs, 30_000);
  const groupingPollInterval = setInterval(pollGroupingJobs, 30_000);

  // 종료 시그널 처리
  const cleanup = () => {
    log("[워커] 종료 중...");
    channel.unsubscribe();
    clearInterval(pollInterval);
    clearInterval(groupingPollInterval);
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  log("[워커] 대기 중... (Realtime 구독 + 30초 폴링)");
}

startWorker();

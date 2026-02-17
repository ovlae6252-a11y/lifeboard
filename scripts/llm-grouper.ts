import { Ollama } from "ollama";
import type { SupabaseClient } from "@supabase/supabase-js";

// LLM 그룹핑에 필요한 기사 데이터
interface ArticleForGrouping {
  id: string;
  title: string;
  group_id: string | null;
  created_at: string;
}

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 3000;
const TIMEOUT_MS = 60_000;

// 기사 제목 목록으로 그룹핑 프롬프트 구성
function buildGroupingPrompt(titles: string[]): string {
  const titleList = titles.map((t, i) => `${i}: "${t}"`).join("\n");

  return `다음 뉴스 기사 제목들 중 같은 사건/이슈를 다루는 기사들을 묶어주세요.

규칙:
- 동일한 사건, 발언, 결정을 다루는 기사면 같은 그룹
- 비슷한 주제라도 다른 사건이면 다른 그룹
- 확실하지 않으면 별도 그룹으로 분리 (보수적으로 판단)
- 모든 기사 인덱스가 결과에 포함되어야 함

기사 목록:
${titleList}

반드시 아래 JSON 형식만 출력하세요 (설명 없이):
{"groups": [[인덱스, ...], [인덱스, ...], ...]}

예시 (기사 4개인 경우): {"groups": [[0,2], [1], [3]]}`;
}

// LLM 응답에서 JSON 그룹 배열 추출
function parseGroupingResponse(response: string): number[][] | null {
  try {
    // JSON 블록 추출 ({"groups": ...} 패턴)
    const match = response.match(/\{[\s\S]*"groups"[\s\S]*?\}/);
    if (!match) return null;

    const parsed = JSON.parse(match[0]) as { groups: unknown };
    if (!parsed.groups || !Array.isArray(parsed.groups)) return null;

    // 각 그룹이 숫자 배열인지 검증
    const groups = parsed.groups as unknown[];
    const validated = groups.filter(
      (g) =>
        Array.isArray(g) && (g as unknown[]).every((n) => typeof n === "number"),
    ) as number[][];

    return validated.length > 0 ? validated : null;
  } catch {
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// LLM 그룹핑 결과를 DB에 적용 (다른 그룹에 있는 기사들 병합)
async function applyGrouping(
  articles: ArticleForGrouping[],
  groups: number[][],
  supabase: SupabaseClient,
): Promise<string[]> {
  const mergedGroupIds: string[] = [];

  for (const group of groups) {
    if (group.length < 2) continue;

    // 그룹 내 기사들의 현재 group_id 수집
    const clusterArticles = group
      .map((i) => articles[i])
      .filter((a) => a !== undefined && a.group_id !== null);

    const uniqueGroupIds = [
      ...new Set(clusterArticles.map((a) => a.group_id as string)),
    ];

    if (uniqueGroupIds.length < 2) continue; // 이미 같은 그룹

    // 가장 오래된 그룹을 타겟으로 선택 (created_at 기준)
    const oldestArticle = clusterArticles.reduce((a, b) =>
      a.created_at < b.created_at ? a : b,
    );
    const targetGroupId = oldestArticle.group_id as string;
    const sourceGroupIds = uniqueGroupIds.filter((id) => id !== targetGroupId);

    console.log(
      `[그룹핑] 병합: ${sourceGroupIds.length}개 → target=${targetGroupId.slice(0, 8)}`,
    );

    const { error } = await supabase.rpc("merge_groups", {
      p_source_ids: sourceGroupIds,
      p_target_id: targetGroupId,
    });

    if (error) {
      console.error("[그룹핑] merge_groups RPC 실패:", error.message);
      continue;
    }

    mergedGroupIds.push(targetGroupId);
  }

  return mergedGroupIds;
}

// 전체 LLM 그룹핑 플로우
export async function groupArticlesByLLM(
  jobId: string,
  articleIds: string[],
  supabase: SupabaseClient,
): Promise<void> {
  // 1. 기사 정보 조회 (제목 + 현재 group_id)
  const { data: articles, error: fetchError } = await supabase
    .from("news_articles")
    .select("id, title, group_id, created_at")
    .in("id", articleIds)
    .eq("is_deleted", false);

  if (fetchError || !articles || articles.length < 2) {
    console.log(
      `[그룹핑] 기사 조회 실패 또는 부족 (job=${jobId.slice(0, 8)}):`,
      fetchError?.message,
    );
    return;
  }

  const titles = (articles as ArticleForGrouping[]).map((a) => a.title);

  // 2. Ollama LLM 호출
  const ollama = new Ollama({
    host: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
  });
  const model = process.env.OLLAMA_MODEL || "qwen2.5:14b";
  const prompt = buildGroupingPrompt(titles);

  let rawResponse = "";

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await ollama.chat({
        model,
        messages: [{ role: "user", content: prompt }],
        signal: controller.signal as AbortSignal,
      });
      clearTimeout(timeout);
      rawResponse = response.message.content.trim();
      break;
    } catch (error) {
      clearTimeout(timeout);

      if (attempt === MAX_RETRIES) {
        console.error(
          `[그룹핑] Ollama ${MAX_RETRIES}회 호출 실패 (job=${jobId.slice(0, 8)}):`,
          error instanceof Error ? error.message : error,
        );
        return; // graceful degradation
      }

      console.error(
        `[그룹핑] Ollama 호출 실패 (${attempt}/${MAX_RETRIES}), 재시도...`,
        error instanceof Error ? error.message : error,
      );
      await sleep(RETRY_DELAY_MS);
    }
  }

  if (!rawResponse) return;

  // 3. 응답 파싱
  const groups = parseGroupingResponse(rawResponse);
  if (!groups) {
    console.log(
      `[그룹핑] JSON 파싱 실패 (job=${jobId.slice(0, 8)}), 원문: ${rawResponse.slice(0, 200)}`,
    );
    return; // graceful degradation
  }

  console.log(
    `[그룹핑] LLM 결과: 기사 ${articles.length}개 → ${groups.length}개 그룹 (job=${jobId.slice(0, 8)})`,
  );

  // 4. 그룹핑 적용 (병합)
  const mergedGroupIds = await applyGrouping(
    articles as ArticleForGrouping[],
    groups,
    supabase,
  );

  if (mergedGroupIds.length === 0) {
    console.log(`[그룹핑] 병합 대상 없음 (job=${jobId.slice(0, 8)})`);
    return;
  }

  // 5. 병합된 그룹 재요약 등록
  const { error: enqueueError } = await supabase.rpc("enqueue_summarize_jobs", {
    p_group_ids: mergedGroupIds,
    p_requested_by: "llm-grouper",
  });

  if (enqueueError) {
    console.error("[그룹핑] 재요약 등록 실패:", enqueueError.message);
  } else {
    console.log(
      `[그룹핑] 재요약 등록: ${mergedGroupIds.length}개 그룹 (job=${jobId.slice(0, 8)})`,
    );
  }
}

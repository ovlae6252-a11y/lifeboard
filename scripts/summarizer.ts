import { Ollama } from "ollama";

// Ollama 팩트 요약에 사용할 기사 데이터
export interface ArticleForSummary {
  title: string;
  description: string | null;
}

// PRD에 정의된 팩트 추출 프롬프트
const FACT_EXTRACTION_PROMPT = `**CRITICAL: 반드시 한국어로만 작성하세요. 절대로 다른 언어(영어, 중국어, 일본어 등)를 섞지 마세요.**

당신은 팩트 체커입니다. 아래 뉴스 기사들을 분석하여 다음 규칙을 따라 정리해주세요:

1. 검증 가능한 사실(팩트)만 추출하세요
2. 기자, 전문가, 관계자의 의견/전망/추측은 제외하세요
3. "~할 것으로 보인다", "~할 전망이다", "~라는 분석이다" 등 추측성 표현은 제외하세요
4. 여러 기사에서 공통으로 언급된 사실을 우선 포함하세요
5. 숫자, 날짜, 인물, 기관명 등 구체적 정보를 포함하세요
6. 3~5개 핵심 팩트를 불릿 포인트로 정리하세요

**응답은 반드시 한국어로만 작성하세요. 다른 언어를 절대 사용하지 마세요.**`;

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;
const TIMEOUT_MS = 120_000;

// 기사 목록으로 프롬프트 구성
function buildPrompt(articles: ArticleForSummary[]): string {
  const articleList = articles
    .map((article, i) => {
      const desc = article.description ? `\n   요약: ${article.description}` : "";
      return `${i + 1}. 제목: ${article.title}${desc}`;
    })
    .join("\n");

  return `${FACT_EXTRACTION_PROMPT}\n\n--- 뉴스 기사 목록 ---\n${articleList}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Ollama를 사용하여 팩트 요약 생성
// 타임아웃 120초, 최대 3회 재시도
export async function summarize(
  articles: ArticleForSummary[],
): Promise<string> {
  const ollama = new Ollama({
    host: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
  });
  const model = process.env.OLLAMA_MODEL || "qwen2.5:14b";
  const prompt = buildPrompt(articles);

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
      return response.message.content.trim();
    } catch (error) {
      clearTimeout(timeout);

      if (attempt === MAX_RETRIES) {
        throw new Error(
          `Ollama 호출 ${MAX_RETRIES}회 실패: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      console.error(
        `[요약] Ollama 호출 실패 (${attempt}/${MAX_RETRIES}), ${RETRY_DELAY_MS / 1000}초 후 재시도...`,
        error instanceof Error ? error.message : error,
      );
      await sleep(RETRY_DELAY_MS);
    }
  }

  // 도달하지 않지만 TypeScript 컴파일을 위해
  throw new Error("Ollama 호출 실패");
}

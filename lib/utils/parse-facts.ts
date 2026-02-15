/**
 * AI 팩트 요약 텍스트를 개별 팩트 문자열 배열로 파싱한다.
 * 불릿 마커(•, -, ·, *, 숫자.) 를 제거하고 순수 텍스트만 반환.
 */
export function parseFacts(factSummary: string): string[] {
  if (!factSummary || !factSummary.trim()) return [];

  const lines = factSummary
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const facts = lines
    .map((line) =>
      line
        // 불릿 마커 제거: •, -, ·, *, 숫자. 등
        .replace(/^[•\-·*]\s*/, "")
        .replace(/^\d+[.)]\s*/, "")
        .trim(),
    )
    .filter((line) => line.length > 0);

  // 파싱 결과가 비어있으면 원본 텍스트를 단일 요소로 반환
  if (facts.length === 0) return [factSummary.trim()];

  return facts;
}

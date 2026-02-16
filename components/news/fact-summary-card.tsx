import { CheckCircle2, ExternalLink, Loader2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { parseFacts } from "@/lib/utils/parse-facts";

interface FactSummaryCardProps {
  factSummary: string | null;
  isSummarized: boolean;
}

// 의미 없는 요약인지 검증 (AI가 내용 없이 안내만 한 경우)
function isInvalidSummary(text: string): boolean {
  const invalidPatterns = [
    /제공된 제목만으로는/,
    /구체적인 정보를 찾기 위해/,
    /기사 내용이 필요합니다/,
    /추가 정보가 제공된다면/,
    /명확한 팩트 추출을 위해/,
    /해당 기사로부터는.*정리할 수 있는 구체적 사실을 제시하기 어렵습니다/,
  ];

  return invalidPatterns.some((pattern) => pattern.test(text));
}

/**
 * 팩트 요약 카드 컴포넌트.
 * 핵심 내용을 불릿 리스트로 표시.
 * Server Component.
 */
export function FactSummaryCard({
  factSummary,
  isSummarized,
}: FactSummaryCardProps) {
  const facts = factSummary ? parseFacts(factSummary) : [];
  const hasValidSummary =
    isSummarized && factSummary && !isInvalidSummary(factSummary);

  return (
    <section aria-labelledby="fact-summary-heading">
      <Card className="border-accent/20 bg-accent/5 p-6">
        <div className="mb-4 flex items-center gap-2">
          {hasValidSummary ? (
            <CheckCircle2 className="text-primary h-5 w-5" />
          ) : isSummarized ? (
            <ExternalLink className="text-muted-foreground h-5 w-5" />
          ) : (
            <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
          )}
          <h2
            id="fact-summary-heading"
            className="font-serif text-lg font-semibold"
          >
            주요 내용
          </h2>
        </div>

        {hasValidSummary && facts.length > 0 ? (
          <ul className="space-y-3">
            {facts.map((fact, index) => (
              <li key={index} className="flex gap-3">
                <span
                  className="bg-primary/60 mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                  aria-hidden="true"
                />
                <span className="text-foreground flex-1 leading-relaxed">
                  {fact}
                </span>
              </li>
            ))}
          </ul>
        ) : isSummarized ? (
          <div className="text-muted-foreground">
            <p className="leading-relaxed">
              상세 내용은 아래 관련 기사 원문을 확인하세요.
            </p>
          </div>
        ) : (
          <div className="text-muted-foreground flex items-center gap-2">
            <div className="bg-muted h-32 w-full animate-pulse rounded" />
            <p className="sr-only">내용을 처리하고 있습니다...</p>
          </div>
        )}
      </Card>
    </section>
  );
}

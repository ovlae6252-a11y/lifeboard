import { ClipboardCheck } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parseFacts } from "@/lib/utils/parse-facts";

interface FactSummaryCardProps {
  factSummary: string | null;
  isSummarized: boolean;
}

export function FactSummaryCard({
  factSummary,
  isSummarized,
}: FactSummaryCardProps) {
  const facts = isSummarized && factSummary ? parseFacts(factSummary) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="text-primary h-5 w-5" />
          <span className="font-serif text-lg font-semibold">팩트 체크</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {facts.length > 0 ? (
          <ul className="space-y-3">
            {facts.map((fact, i) => (
              <li key={i} className="flex items-start gap-3">
                <ClipboardCheck className="text-primary/60 mt-0.5 h-4 w-4 shrink-0" />
                <span className="text-foreground/90 flex-1 text-base leading-relaxed">
                  {fact}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <div className="bg-muted h-4 w-4 animate-pulse rounded-full" />
            <span>AI 팩트 요약 생성 중입니다...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

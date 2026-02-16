import { ArrowLeft, Calendar } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function NewsDetailLoading() {
  return (
    <div className="space-y-6">
      {/* 뒤로가기 버튼 */}
      <div>
        <Button variant="ghost" size="sm" disabled className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          뉴스 목록
        </Button>
      </div>

      {/* 헤더: 제목 + 메타정보 스켈레톤 */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="bg-muted">
            <Skeleton className="h-4 w-12" />
          </Badge>
          <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <Calendar className="h-3.5 w-3.5" />
            <Skeleton className="h-4 w-16" />
          </span>
          <Skeleton className="h-4 w-16" />
        </div>

        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-8 w-1/2" />
      </div>

      {/* 팩트 요약 스켈레톤 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-6 w-24" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
        </CardContent>
      </Card>

      {/* 관련 기사 목록 스켈레톤 */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2 rounded-lg p-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

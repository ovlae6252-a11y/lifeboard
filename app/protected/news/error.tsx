"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NewsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardContent
          className="flex flex-col items-center gap-4 pt-8 text-center"
          role="alert"
        >
          <AlertCircle
            className="h-12 w-12 text-destructive"
            aria-hidden="true"
          />
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">
              뉴스를 불러오는 중 문제가 발생했습니다
            </h2>
            <p className="text-sm text-muted-foreground">
              잠시 후 다시 시도해 주세요
            </p>
          </div>
          <Button variant="outline" onClick={reset}>
            다시 시도
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

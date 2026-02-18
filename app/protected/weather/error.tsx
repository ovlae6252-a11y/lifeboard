"use client";

import { useEffect } from "react";
import { CloudOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function WeatherError({
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
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardContent
          className="flex flex-col items-center gap-4 py-12 text-center"
          role="alert"
        >
          <CloudOff
            className="text-muted-foreground h-12 w-12"
            aria-hidden="true"
          />
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">날씨를 불러올 수 없습니다</h2>
            <p className="text-muted-foreground text-sm">
              API 키 설정을 확인하거나 잠시 후 다시 시도해 주세요
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

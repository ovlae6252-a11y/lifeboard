"use client";

import { Calendar } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils/format-time";
import { cn } from "@/lib/utils";

interface RelativeTimeProps {
  dateTime: string;
  /**
   * 아이콘을 표시할지 여부 (기본: true)
   */
  showIcon?: boolean;
  /**
   * 추가 CSS 클래스 (기본 스타일과 병합됨)
   */
  className?: string;
}

/**
 * 상대 시간을 표시하는 Client Component.
 * Date.now()를 사용하므로 클라이언트에서 동적으로 계산됨.
 */
export function RelativeTime({
  dateTime,
  showIcon = true,
  className,
}: RelativeTimeProps) {
  return (
    <span
      className={cn(
        "text-muted-foreground flex items-center gap-1.5 text-sm",
        className,
      )}
    >
      {showIcon && <Calendar className="h-3.5 w-3.5" />}
      <time dateTime={dateTime}>{formatRelativeTime(dateTime)}</time>
    </span>
  );
}

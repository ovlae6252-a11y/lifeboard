"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

interface BookmarkButtonProps {
  /** 뉴스 그룹 ID */
  groupId: string;
  /** 초기 북마크 상태 */
  isBookmarked: boolean;
  /** 버튼 크기 (기본: default) */
  size?: "default" | "sm" | "lg" | "icon";
  /** 버튼 스타일 (기본: ghost) */
  variant?: "default" | "ghost" | "outline";
}

/**
 * 북마크 버튼 컴포넌트
 * - 낙관적 UI 업데이트로 즉각적인 피드백 제공
 * - API 호출 실패 시 자동 롤백
 */
export function BookmarkButton({
  groupId,
  isBookmarked: initialIsBookmarked,
  size = "default",
  variant = "ghost",
}: BookmarkButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [optimisticBookmarked, setOptimisticBookmarked] =
    useOptimistic(isBookmarked);

  const toggleBookmark = async () => {
    const newBookmarkedState = !isBookmarked;

    // 낙관적 업데이트
    startTransition(() => {
      setOptimisticBookmarked(newBookmarkedState);
    });

    try {
      const method = newBookmarkedState ? "POST" : "DELETE";
      const response = await fetch("/api/news/bookmarks", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group_id: groupId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "북마크 처리 실패");
      }

      // 성공 시 실제 상태 업데이트
      setIsBookmarked(newBookmarkedState);

      // 성공 메시지
      toast.success(
        newBookmarkedState
          ? "북마크에 추가되었습니다"
          : "북마크가 제거되었습니다",
      );
    } catch (error) {
      // 실패 시 롤백
      setOptimisticBookmarked(isBookmarked);

      // 에러 메시지
      toast.error(error instanceof Error ? error.message : "북마크 처리 실패");
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleBookmark}
      disabled={isPending}
      aria-label={optimisticBookmarked ? "북마크 제거" : "북마크에 추가"}
    >
      {optimisticBookmarked ? (
        <BookmarkCheck className="h-4 w-4" />
      ) : (
        <Bookmark className="h-4 w-4" />
      )}
      {size !== "icon" && (
        <span className="ml-2">
          {optimisticBookmarked ? "북마크됨" : "북마크"}
        </span>
      )}
    </Button>
  );
}

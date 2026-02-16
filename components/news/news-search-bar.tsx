"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * 뉴스 검색바 컴포넌트
 * - URL 쿼리 파라미터(?q=)를 통해 검색 상태 관리
 * - 검색어 입력 후 Enter 또는 검색 버튼 클릭 시 검색
 * - X 버튼으로 검색어 초기화 및 검색 해제
 */
export function NewsSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("q") || "";

  const [query, setQuery] = useState(queryParam);

  // URL 쿼리 파라미터 변경 시 로컬 상태 동기화
  useEffect(() => {
    setQuery(queryParam);
  }, [queryParam]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();

    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    const params = new URLSearchParams(searchParams);
    params.set("q", trimmedQuery);
    params.delete("page"); // 검색 시 페이지 초기화

    router.push(`/protected/news?${params.toString()}`);
  };

  const handleClear = () => {
    setQuery("");

    const params = new URLSearchParams(searchParams);
    params.delete("q");
    params.delete("page"); // 검색 해제 시 페이지 초기화

    router.push(`/protected/news?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="flex w-full gap-2">
      <div className="relative flex-1">
        <Input
          type="text"
          placeholder="뉴스 검색 (제목, 팩트 요약)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pr-9"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="absolute top-0 right-0 h-full px-2 hover:bg-transparent"
            aria-label="검색어 지우기"
          >
            <X className="text-muted-foreground h-4 w-4" />
          </Button>
        )}
      </div>
      <Button type="submit" disabled={!query.trim()}>
        <Search className="mr-2 h-4 w-4" />
        검색
      </Button>
    </form>
  );
}

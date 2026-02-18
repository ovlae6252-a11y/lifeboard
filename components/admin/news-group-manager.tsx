"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NEWS_CATEGORIES, getCategoryLabel } from "@/lib/news/categories";

const FILTER_CATEGORIES = NEWS_CATEGORIES.filter(
  (c) => c.value !== "bookmarks",
);

interface NewsGroup {
  id: string;
  category: string;
  is_valid: boolean;
  article_count: number;
  fact_summary: string | null;
  created_at: string;
  news_articles?: { title: string; published_at: string } | null;
}

const PAGE_SIZE = 20;

export function NewsGroupManager() {
  const [groups, setGroups] = useState<NewsGroup[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [isValid, setIsValid] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (category !== "all") params.set("category", category);
      if (isValid !== "all") params.set("is_valid", isValid);

      const res = await fetch(`/api/admin/news/groups?${params}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setGroups(json.groups ?? []);
      setTotal(json.total ?? 0);
    } catch {
      toast.error("그룹 목록 조회에 실패했습니다");
    } finally {
      setLoading(false);
    }
  }, [page, category, isValid]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // 필터 변경 시 1페이지로 리셋
  const handleCategoryChange = (v: string) => {
    setCategory(v);
    setPage(1);
    setSelected(new Set());
  };
  const handleValidChange = (v: string) => {
    setIsValid(v);
    setPage(1);
    setSelected(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === groups.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(groups.map((g) => g.id)));
    }
  };

  const handleToggleValid = async (group: NewsGroup) => {
    const newValue = !group.is_valid;
    setGroups((prev) =>
      prev.map((g) => (g.id === group.id ? { ...g, is_valid: newValue } : g)),
    );
    try {
      const res = await fetch("/api/admin/news/groups", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: group.id, is_valid: newValue }),
      });
      if (!res.ok) throw new Error();
      toast.success(
        newValue ? "그룹이 노출 처리되었습니다" : "그룹이 숨김 처리되었습니다",
      );
    } catch {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === group.id ? { ...g, is_valid: !newValue } : g,
        ),
      );
      toast.error("상태 변경에 실패했습니다");
    }
  };

  const handleRerunSummary = async (groupIds: string[]) => {
    if (groupIds.length === 0) {
      toast.error("선택된 그룹이 없습니다");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/news/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rerun_summary", groupIds }),
      });
      if (!res.ok) throw new Error();
      toast.success(`${groupIds.length}개 그룹의 요약 재실행이 등록되었습니다`);
      setSelected(new Set());
    } catch {
      toast.error("요약 재실행 등록에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* 필터 + 일괄 액션 */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={category} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="카테고리" />
          </SelectTrigger>
          <SelectContent>
            {FILTER_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={isValid} onValueChange={handleValidChange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="유효성" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="true">유효</SelectItem>
            <SelectItem value="false">무효</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          {selected.size > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRerunSummary(Array.from(selected))}
              disabled={submitting}
            >
              <RefreshCw className="mr-1 h-3.5 w-3.5" />
              요약 재실행 ({selected.size})
            </Button>
          )}
          <span className="text-muted-foreground text-sm">총 {total}개</span>
        </div>
      </div>

      {loading ? (
        <div className="text-muted-foreground py-8 text-center text-sm">
          로딩 중...
        </div>
      ) : groups.length === 0 ? (
        <div className="text-muted-foreground py-8 text-center text-sm">
          그룹이 없습니다
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={
                      selected.size === groups.length && groups.length > 0
                    }
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead>대표 기사</TableHead>
                <TableHead>카테고리</TableHead>
                <TableHead>기사 수</TableHead>
                <TableHead>유효성</TableHead>
                <TableHead>요약</TableHead>
                <TableHead className="text-right">액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(group.id)}
                      onCheckedChange={() => toggleSelect(group.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <p className="line-clamp-2 max-w-xs text-sm">
                      {group.news_articles?.title ?? "(제목 없음)"}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {group.id.slice(0, 8)}...
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getCategoryLabel(group.category)}
                    </Badge>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {group.article_count}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={group.is_valid ? "secondary" : "destructive"}
                    >
                      {group.is_valid ? "유효" : "무효"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={group.fact_summary ? "secondary" : "outline"}
                    >
                      {group.fact_summary ? "완료" : "없음"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleToggleValid(group)}
                      >
                        {group.is_valid ? "숨김" : "노출"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleRerunSummary([group.id])}
                        disabled={submitting}
                      >
                        재요약
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-muted-foreground text-sm">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

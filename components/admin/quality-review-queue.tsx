"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { RotateCcw, CheckCircle } from "lucide-react";
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

interface QualityGroup {
  id: string;
  fact_summary: string | null;
  created_at: string;
  news_articles: { title: string } | null;
}

const PAGE_SIZE = 20;

export function QualityReviewQueue() {
  const [groups, setGroups] = useState<QualityGroup[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const fetchGroups = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/moderation/quality?page=${p}`);
      if (!res.ok) throw new Error("조회 실패");
      const json = await res.json();
      setGroups(json.groups ?? []);
      setTotal(json.total ?? 0);
      setPage(p);
      setSelected(new Set());
    } catch {
      toast.error("품질 검토 목록 조회에 실패했습니다");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups(1);
  }, [fetchGroups]);

  const addProcessing = (id: string) =>
    setProcessing((prev) => new Set(prev).add(id));
  const removeProcessing = (id: string) =>
    setProcessing((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

  const handleApprove = async (id: string) => {
    addProcessing(id);
    try {
      const res = await fetch("/api/admin/moderation/quality", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "approve" }),
      });
      if (!res.ok) throw new Error();
      setGroups((prev) => prev.filter((g) => g.id !== id));
      setTotal((prev) => prev - 1);
      toast.success("그룹이 승인되었습니다");
    } catch {
      toast.error("승인에 실패했습니다");
    } finally {
      removeProcessing(id);
    }
  };

  const handleRerun = async (id: string) => {
    addProcessing(id);
    try {
      const res = await fetch("/api/admin/moderation/quality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rerun", groupIds: [id] }),
      });
      if (!res.ok) throw new Error();
      toast.success("요약 재실행이 예약되었습니다");
    } catch {
      toast.error("재실행 요청에 실패했습니다");
    } finally {
      removeProcessing(id);
    }
  };

  const handleBulkRerun = async () => {
    if (selected.size === 0) return;
    setBulkProcessing(true);
    try {
      const res = await fetch("/api/admin/moderation/quality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rerun", groupIds: [...selected] }),
      });
      if (!res.ok) throw new Error();
      toast.success(`${selected.size}개 그룹의 요약 재실행이 예약되었습니다`);
      setSelected(new Set());
    } catch {
      toast.error("일괄 재실행에 실패했습니다");
    } finally {
      setBulkProcessing(false);
    }
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

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

  return (
    <div className="space-y-4">
      {/* 상단: 총 건수 + 일괄 재요약 버튼 */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          검증 실패 그룹 <strong>{total}</strong>개
        </p>
        {selected.size > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleBulkRerun}
            disabled={bulkProcessing}
          >
            <RotateCcw className="mr-1 h-4 w-4" />
            {bulkProcessing ? "요청 중..." : `선택한 ${selected.size}개 재요약`}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-muted-foreground py-12 text-center text-sm">
          로딩 중...
        </div>
      ) : groups.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed py-12 text-center text-sm">
          검증 실패 그룹이 없습니다
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={
                      groups.length > 0 && selected.size === groups.length
                    }
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead>대표 기사 제목</TableHead>
                <TableHead className="hidden md:table-cell">
                  팩트 요약
                </TableHead>
                <TableHead className="hidden md:table-cell">생성일</TableHead>
                <TableHead className="text-right">관리</TableHead>
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
                    <p className="max-w-xs truncate text-sm font-medium">
                      {group.news_articles?.title ?? "제목 없음"}
                    </p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {group.fact_summary ? (
                      <p className="text-muted-foreground max-w-xs truncate text-xs">
                        {group.fact_summary.slice(0, 50)}
                        {group.fact_summary.length > 50 ? "..." : ""}
                      </p>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        요약 없음
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-muted-foreground text-xs">
                      {formatDate(group.created_at)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        disabled={processing.has(group.id)}
                        onClick={() => handleApprove(group.id)}
                      >
                        <CheckCircle className="mr-1 h-3.5 w-3.5" />
                        승인
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        disabled={processing.has(group.id)}
                        onClick={() => handleRerun(group.id)}
                      >
                        <RotateCcw className="mr-1 h-3.5 w-3.5" />
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
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => fetchGroups(page - 1)}
          >
            이전
          </Button>
          <span className="text-muted-foreground text-sm">
            {page} / {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => fetchGroups(page + 1)}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
}

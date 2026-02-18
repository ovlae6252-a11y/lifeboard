"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SummarizeJob {
  id: string;
  group_id: string;
  group_title: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

const PAGE_SIZE = 20;
const ONE_HOUR_MS = 60 * 60 * 1000;

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending: {
    label: "대기",
    className: "bg-muted text-muted-foreground",
  },
  processing: {
    label: "처리 중",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },
  completed: {
    label: "완료",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  },
  failed: {
    label: "실패",
    className: "bg-destructive/10 text-destructive",
  },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_MAP[status] ?? STATUS_MAP.pending;
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isStuckProcessing(job: SummarizeJob) {
  if (job.status !== "processing" || !job.started_at) return false;
  return Date.now() - new Date(job.started_at).getTime() >= ONE_HOUR_MS;
}

export function JobManager() {
  const [jobs, setJobs] = useState<SummarizeJob[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchJobs = useCallback(
    async (p: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(p),
          limit: String(PAGE_SIZE),
        });
        if (statusFilter !== "all") params.set("status", statusFilter);

        const res = await fetch(
          `/api/admin/monitoring/jobs?${params.toString()}`,
        );
        if (!res.ok) throw new Error("조회 실패");
        const json = await res.json();
        setJobs(json.data ?? []);
        setTotal(json.total ?? 0);
        setPage(p);
      } catch {
        toast.error("요약 작업 조회에 실패했습니다");
      } finally {
        setLoading(false);
      }
    },
    [statusFilter],
  );

  useEffect(() => {
    fetchJobs(1);
  }, [fetchJobs]);

  const handleAction = async (
    jobId: string,
    action: "retry" | "reset",
    label: string,
  ) => {
    setProcessing(jobId);
    try {
      const res = await fetch("/api/admin/monitoring/jobs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, jobId }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "요청 실패");
      }
      toast.success(`${label} 완료`);
      await fetchJobs(page);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "처리에 실패했습니다");
    } finally {
      setProcessing(null);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* 필터 */}
      <div className="flex gap-2">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue placeholder="전체 상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="pending">대기</SelectItem>
            <SelectItem value="processing">처리 중</SelectItem>
            <SelectItem value="completed">완료</SelectItem>
            <SelectItem value="failed">실패</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-muted-foreground text-sm">
        총 <strong>{total.toLocaleString()}</strong>건
      </p>

      {loading ? (
        <div className="text-muted-foreground py-12 text-center text-sm">
          로딩 중...
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed py-12 text-center text-sm">
          요약 작업이 없습니다
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>그룹 제목</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="hidden sm:table-cell">생성일</TableHead>
                <TableHead className="hidden md:table-cell">완료일</TableHead>
                <TableHead>액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <span className="max-w-[200px] truncate text-xs">
                      {job.group_title
                        ? job.group_title.slice(0, 30)
                        : job.group_id.slice(0, 8) + "..."}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={job.status} />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="text-muted-foreground text-xs">
                      {formatDate(job.created_at)}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-muted-foreground text-xs">
                      {formatDate(job.completed_at)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {job.status === "failed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-xs"
                        disabled={processing === job.id}
                        onClick={() => handleAction(job.id, "retry", "재시도")}
                      >
                        <RotateCcw className="mr-1 h-3 w-3" />
                        재시도
                      </Button>
                    )}
                    {isStuckProcessing(job) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-xs"
                        disabled={processing === job.id}
                        onClick={() => handleAction(job.id, "reset", "리셋")}
                      >
                        <RotateCcw className="mr-1 h-3 w-3" />
                        리셋
                      </Button>
                    )}
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
            onClick={() => fetchJobs(page - 1)}
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
            onClick={() => fetchJobs(page + 1)}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
}

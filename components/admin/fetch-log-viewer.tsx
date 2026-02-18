"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
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

interface FetchLog {
  id: string;
  source_id: string;
  source_name: string;
  status: string;
  articles_fetched: number;
  articles_new: number;
  filtered_count: number;
  error_message: string | null;
  created_at: string;
}

interface NewsSource {
  id: string;
  name: string;
}

const PAGE_SIZE = 20;

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  if (status === "success") {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
        <CheckCircle2 className="h-3 w-3" />
        성공
      </span>
    );
  }
  return (
    <span className="text-destructive bg-destructive/10 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium">
      <XCircle className="h-3 w-3" />
      실패
    </span>
  );
}

export function FetchLogViewer() {
  const [logs, setLogs] = useState<FetchLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<NewsSource[]>([]);

  const [sourceId, setSourceId] = useState("all");
  const [status, setStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchLogs = useCallback(
    async (p: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(p),
          limit: String(PAGE_SIZE),
        });
        if (sourceId !== "all") params.set("sourceId", sourceId);
        if (status !== "all") params.set("status", status);
        if (dateFrom) params.set("dateFrom", dateFrom);
        if (dateTo) params.set("dateTo", dateTo);

        const res = await fetch(
          `/api/admin/monitoring/logs?${params.toString()}`,
        );
        if (!res.ok) throw new Error("조회 실패");
        const json = await res.json();
        setLogs(json.data ?? []);
        setTotal(json.total ?? 0);
        setPage(p);
      } catch {
        toast.error("수집 로그 조회에 실패했습니다");
      } finally {
        setLoading(false);
      }
    },
    [sourceId, status, dateFrom, dateTo],
  );

  // 소스 목록 조회
  useEffect(() => {
    fetch("/api/admin/news/sources")
      .then((r) => r.json())
      .then((json) => setSources(json.sources ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* 필터 */}
      <div className="flex flex-wrap gap-2">
        <Select value={sourceId} onValueChange={(v) => setSourceId(v)}>
          <SelectTrigger className="h-8 w-40 text-xs">
            <SelectValue placeholder="전체 소스" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 소스</SelectItem>
            {sources.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(v) => setStatus(v)}>
          <SelectTrigger className="h-8 w-28 text-xs">
            <SelectValue placeholder="전체 상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="success">성공</SelectItem>
            <SelectItem value="error">실패</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="h-8 w-36 text-xs"
          placeholder="시작일"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="h-8 w-36 text-xs"
          placeholder="종료일"
        />
      </div>

      <p className="text-muted-foreground text-sm">
        총 <strong>{total.toLocaleString()}</strong>건
      </p>

      {loading ? (
        <div className="text-muted-foreground py-12 text-center text-sm">
          로딩 중...
        </div>
      ) : logs.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed py-12 text-center text-sm">
          수집 로그가 없습니다
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>수집 시간</TableHead>
                <TableHead>소스명</TableHead>
                <TableHead className="text-right">수집</TableHead>
                <TableHead className="text-right">신규</TableHead>
                <TableHead className="hidden text-right sm:table-cell">
                  필터링
                </TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="hidden md:table-cell">에러</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <span className="text-muted-foreground text-xs">
                      {formatDate(log.created_at)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="max-w-[120px] truncate text-xs font-medium">
                      {log.source_name}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-xs tabular-nums">
                      {log.articles_fetched}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-xs font-medium tabular-nums">
                      {log.articles_new}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-right sm:table-cell">
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {log.filtered_count}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={log.status} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {log.error_message && (
                      <span className="text-destructive max-w-[200px] truncate text-xs">
                        {log.error_message}
                      </span>
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
            onClick={() => fetchLogs(page - 1)}
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
            onClick={() => fetchLogs(page + 1)}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Search, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface NewsArticle {
  id: string;
  title: string;
  source_id: string;
  group_id: string | null;
  published_at: string | null;
  is_deleted: boolean;
  created_at: string;
}

const PAGE_SIZE = 20;

function formatDate(isoString: string | null): string {
  if (!isoString) return "-";
  return new Date(isoString).toLocaleDateString("ko-KR", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  });
}

export function NewsArticleManager() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<NewsArticle | null>(null);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (query) params.set("q", query);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await fetch(`/api/admin/news/articles?${params}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setArticles(json.articles ?? []);
      setTotal(json.total ?? 0);
    } catch {
      toast.error("기사 목록 조회에 실패했습니다");
    } finally {
      setLoading(false);
    }
  }, [page, query, dateFrom, dateTo]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleSearch = () => {
    setQuery(searchInput);
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch("/api/admin/news/articles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      if (!res.ok) throw new Error();
      toast.success("기사가 삭제되었습니다");
      setArticles((prev) =>
        prev.map((a) =>
          a.id === deleteTarget.id ? { ...a, is_deleted: true } : a,
        ),
      );
    } catch {
      toast.error("삭제에 실패했습니다");
    } finally {
      setDeleteTarget(null);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* 검색 필터 */}
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-1 gap-2">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="제목 검색..."
            className="min-w-0"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button size="sm" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="w-36"
          />
          <span className="text-muted-foreground text-sm">~</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="w-36"
          />
        </div>
        <span className="text-muted-foreground self-center text-sm">
          총 {total}개
        </span>
      </div>

      {loading ? (
        <div className="text-muted-foreground py-8 text-center text-sm">
          로딩 중...
        </div>
      ) : articles.length === 0 ? (
        <div className="text-muted-foreground py-8 text-center text-sm">
          기사가 없습니다
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>제목</TableHead>
                <TableHead>그룹</TableHead>
                <TableHead>발행일</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.map((article) => (
                <TableRow
                  key={article.id}
                  className={article.is_deleted ? "opacity-50" : ""}
                >
                  <TableCell>
                    <p className="line-clamp-2 max-w-xs text-sm">
                      {article.title}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      소스: {article.source_id.slice(0, 8)}...
                    </p>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {article.group_id
                      ? article.group_id.slice(0, 8) + "..."
                      : "-"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(article.published_at)}
                  </TableCell>
                  <TableCell>
                    {article.is_deleted ? (
                      <Badge variant="destructive">삭제됨</Badge>
                    ) : (
                      <Badge variant="secondary">정상</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!article.is_deleted && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive h-8 w-8"
                        onClick={() => setDeleteTarget(article)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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

      {/* 삭제 확인 */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>기사를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 기사는 소프트 삭제됩니다. 목록에서는 더 이상 표시되지 않습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

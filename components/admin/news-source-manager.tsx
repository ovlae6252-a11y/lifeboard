"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NEWS_CATEGORIES } from "@/lib/news/categories";

// "all"과 "bookmarks"는 소스 카테고리에서 제외
const SOURCE_CATEGORIES = NEWS_CATEGORIES.filter(
  (c) => c.value !== "all" && c.value !== "bookmarks",
);

interface NewsSource {
  id: string;
  name: string;
  feed_url: string;
  category: string;
  is_active: boolean;
  created_at: string;
}

interface FormState {
  name: string;
  feed_url: string;
  category: string;
}

const EMPTY_FORM: FormState = { name: "", feed_url: "", category: "politics" };

export function NewsSourceManager() {
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<NewsSource | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NewsSource | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/news/sources");
      if (!res.ok) throw new Error("조회 실패");
      const json = await res.json();
      setSources(json.sources ?? []);
    } catch {
      toast.error("소스 목록 조회에 실패했습니다");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (source: NewsSource) => {
    setEditTarget(source);
    setForm({
      name: source.name,
      feed_url: source.feed_url,
      category: source.category,
    });
    setDialogOpen(true);
  };

  const handleToggle = async (source: NewsSource, checked: boolean) => {
    setSources((prev) =>
      prev.map((s) => (s.id === source.id ? { ...s, is_active: checked } : s)),
    );
    try {
      const res = await fetch("/api/admin/news/sources", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: source.id, is_active: checked }),
      });
      if (!res.ok) throw new Error();
      toast.success(
        checked ? "소스가 활성화되었습니다" : "소스가 비활성화되었습니다",
      );
    } catch {
      setSources((prev) =>
        prev.map((s) =>
          s.id === source.id ? { ...s, is_active: !checked } : s,
        ),
      );
      toast.error("상태 변경에 실패했습니다");
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.feed_url.trim()) {
      toast.error("이름과 피드 URL을 입력해주세요");
      return;
    }
    setSubmitting(true);
    try {
      const isEdit = editTarget !== null;
      const res = await fetch("/api/admin/news/sources", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { id: editTarget.id, ...form } : form),
      });
      if (!res.ok) throw new Error();
      toast.success(isEdit ? "소스가 수정되었습니다" : "소스가 추가되었습니다");
      setDialogOpen(false);
      fetchSources();
    } catch {
      toast.error("저장에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/news/sources?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("소스가 삭제되었습니다");
      setSources((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    } catch {
      toast.error("삭제에 실패했습니다");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          총 {sources.length}개 소스
        </p>
        <Button size="sm" onClick={openAdd}>
          <Plus className="mr-1 h-4 w-4" />
          소스 추가
        </Button>
      </div>

      {loading ? (
        <div className="text-muted-foreground py-8 text-center text-sm">
          로딩 중...
        </div>
      ) : sources.length === 0 ? (
        <div className="text-muted-foreground py-8 text-center text-sm">
          등록된 소스가 없습니다
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>언론사명</TableHead>
                <TableHead>카테고리</TableHead>
                <TableHead>활성</TableHead>
                <TableHead className="text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.map((source) => (
                <TableRow key={source.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{source.name}</p>
                      <p className="text-muted-foreground max-w-xs truncate text-xs">
                        {source.feed_url}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{source.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={source.is_active}
                      onCheckedChange={(checked) =>
                        handleToggle(source, checked)
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(source)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive h-8 w-8"
                        onClick={() => setDeleteTarget(source)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 추가/편집 Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget ? "소스 편집" : "소스 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>언론사명</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="예: 조선일보"
              />
            </div>
            {!editTarget && (
              <div className="space-y-1.5">
                <Label>피드 URL</Label>
                <Input
                  value={form.feed_url}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, feed_url: e.target.value }))
                  }
                  placeholder="https://..."
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>카테고리</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 AlertDialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>소스를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.name}</strong> 소스를 삭제합니다. 이 작업은
              되돌릴 수 없습니다.
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

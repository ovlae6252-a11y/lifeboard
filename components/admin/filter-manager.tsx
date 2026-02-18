"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Plus, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface ContentFilter {
  id: string;
  filter_type: string;
  keywords: string[];
  is_active: boolean;
  created_at: string;
}

export function FilterManager() {
  const [filters, setFilters] = useState<ContentFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<ContentFilter | null>(null);
  const [addingKeyword, setAddingKeyword] = useState<string | null>(null);
  const [keywordInput, setKeywordInput] = useState("");
  const [testInput, setTestInput] = useState("");
  const [testMatches, setTestMatches] = useState<string[]>([]);

  const fetchFilters = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/moderation/filters");
      if (!res.ok) throw new Error("조회 실패");
      const json = await res.json();
      setFilters(json.filters ?? []);
    } catch {
      toast.error("필터 목록 조회에 실패했습니다");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  const blacklists = filters.filter((f) => f.filter_type === "blacklist");
  const whitelists = filters.filter((f) => f.filter_type === "whitelist");

  const handleToggle = async (filter: ContentFilter, checked: boolean) => {
    setFilters((prev) =>
      prev.map((f) => (f.id === filter.id ? { ...f, is_active: checked } : f)),
    );
    try {
      const res = await fetch("/api/admin/moderation/filters", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: filter.id, is_active: checked }),
      });
      if (!res.ok) throw new Error();
      toast.success(
        checked ? "필터가 활성화되었습니다" : "필터가 비활성화되었습니다",
      );
    } catch {
      setFilters((prev) =>
        prev.map((f) =>
          f.id === filter.id ? { ...f, is_active: !checked } : f,
        ),
      );
      toast.error("상태 변경에 실패했습니다");
    }
  };

  const handleRemoveKeyword = async (
    filter: ContentFilter,
    keyword: string,
  ) => {
    const newKeywords = filter.keywords.filter((k) => k !== keyword);
    setFilters((prev) =>
      prev.map((f) =>
        f.id === filter.id ? { ...f, keywords: newKeywords } : f,
      ),
    );
    try {
      const res = await fetch("/api/admin/moderation/filters", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: filter.id, keywords: newKeywords }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setFilters((prev) =>
        prev.map((f) =>
          f.id === filter.id ? { ...f, keywords: filter.keywords } : f,
        ),
      );
      toast.error("키워드 삭제에 실패했습니다");
    }
  };

  const handleAddKeyword = async (filter: ContentFilter) => {
    const kw = keywordInput.trim();
    if (!kw) return;
    if (filter.keywords.includes(kw)) {
      toast.error("이미 존재하는 키워드입니다");
      return;
    }
    const newKeywords = [...filter.keywords, kw];
    setFilters((prev) =>
      prev.map((f) =>
        f.id === filter.id ? { ...f, keywords: newKeywords } : f,
      ),
    );
    setKeywordInput("");
    setAddingKeyword(null);
    try {
      const res = await fetch("/api/admin/moderation/filters", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: filter.id, keywords: newKeywords }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setFilters((prev) =>
        prev.map((f) =>
          f.id === filter.id ? { ...f, keywords: filter.keywords } : f,
        ),
      );
      toast.error("키워드 추가에 실패했습니다");
    }
  };

  const handleCreateFilter = async (filterType: string) => {
    try {
      const res = await fetch("/api/admin/moderation/filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filter_type: filterType, keywords: [] }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setFilters((prev) => [json.filter, ...prev]);
      toast.success("새 필터가 추가되었습니다");
    } catch {
      toast.error("필터 추가에 실패했습니다");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(
        `/api/admin/moderation/filters?id=${deleteTarget.id}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error();
      setFilters((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      toast.success("필터가 삭제되었습니다");
    } catch {
      toast.error("삭제에 실패했습니다");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleTest = () => {
    if (!testInput.trim()) {
      setTestMatches([]);
      return;
    }
    const activeBlacklists = filters.filter(
      (f) => f.filter_type === "blacklist" && f.is_active,
    );
    const allKeywords = activeBlacklists.flatMap((f) => f.keywords);
    const matches = allKeywords.filter((kw) =>
      testInput.toLowerCase().includes(kw.toLowerCase()),
    );
    setTestMatches([...new Set(matches)]);
  };

  const renderFilterCards = (
    filterList: ContentFilter[],
    filterType: string,
  ) => {
    if (loading) {
      return (
        <div className="text-muted-foreground py-8 text-center text-sm">
          로딩 중...
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCreateFilter(filterType)}
          >
            <Plus className="mr-1 h-4 w-4" />새 필터 추가
          </Button>
        </div>
        {filterList.length === 0 ? (
          <div className="text-muted-foreground rounded-lg border border-dashed py-8 text-center text-sm">
            등록된 필터가 없습니다
          </div>
        ) : (
          filterList.map((filter) => (
            <div
              key={filter.id}
              className="bg-card border-border space-y-3 rounded-lg border p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">
                  {filter.keywords.length}개 키워드
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground text-xs">
                    {filter.is_active ? "활성" : "비활성"}
                  </span>
                  <Switch
                    checked={filter.is_active}
                    onCheckedChange={(checked) => handleToggle(filter, checked)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive h-7 w-7"
                    onClick={() => setDeleteTarget(filter)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* 키워드 태그 */}
              <div className="flex min-h-7 flex-wrap gap-1.5">
                {filter.keywords.length === 0 ? (
                  <span className="text-muted-foreground text-xs italic">
                    키워드가 없습니다
                  </span>
                ) : (
                  filter.keywords.map((kw) => (
                    <Badge
                      key={kw}
                      variant={
                        filterType === "blacklist" ? "destructive" : "default"
                      }
                      className="gap-1 pr-1"
                    >
                      {kw}
                      <button
                        onClick={() => handleRemoveKeyword(filter, kw)}
                        className="ml-0.5 hover:opacity-70"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>

              {/* 키워드 추가 */}
              {addingKeyword === filter.id ? (
                <div className="flex gap-2">
                  <Input
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddKeyword(filter);
                      if (e.key === "Escape") {
                        setAddingKeyword(null);
                        setKeywordInput("");
                      }
                    }}
                    placeholder="키워드 입력 후 Enter"
                    className="h-8 text-sm"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    className="h-8"
                    onClick={() => handleAddKeyword(filter)}
                  >
                    추가
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8"
                    onClick={() => {
                      setAddingKeyword(null);
                      setKeywordInput("");
                    }}
                  >
                    취소
                  </Button>
                </div>
              ) : (
                <button
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
                  onClick={() => {
                    setAddingKeyword(filter.id);
                    setKeywordInput("");
                  }}
                >
                  <Plus className="h-3 w-3" />
                  키워드 추가
                </button>
              )}
            </div>
          ))
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="blacklist">
        <TabsList>
          <TabsTrigger value="blacklist">
            블랙리스트
            {blacklists.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-xs">
                {blacklists.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="whitelist">
            화이트리스트
            {whitelists.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-xs">
                {whitelists.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="blacklist" className="mt-4 space-y-4">
          {renderFilterCards(blacklists, "blacklist")}

          {/* 필터 테스트 영역 */}
          {!loading && (
            <div className="border-border space-y-3 rounded-lg border p-4">
              <p className="text-sm font-medium">필터 테스트</p>
              <div className="flex gap-2">
                <Input
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleTest()}
                  placeholder="텍스트를 입력하여 블랙리스트 키워드 포함 여부를 확인합니다"
                  className="text-sm"
                />
                <Button size="sm" variant="outline" onClick={handleTest}>
                  테스트
                </Button>
              </div>
              {testInput && (
                <div>
                  {testMatches.length > 0 ? (
                    <div className="space-y-1">
                      <p className="text-destructive text-xs font-medium">
                        차단될 키워드가 감지되었습니다:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {testMatches.map((m) => (
                          <Badge
                            key={m}
                            variant="destructive"
                            className="text-xs"
                          >
                            {m}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      차단될 키워드가 없습니다
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="whitelist" className="mt-4">
          {renderFilterCards(whitelists, "whitelist")}
        </TabsContent>
      </Tabs>

      {/* 삭제 확인 AlertDialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>필터를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.keywords.length}개의 키워드가 포함된 필터를
              삭제합니다. 이 작업은 되돌릴 수 없습니다.
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

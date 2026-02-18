"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Search, UserCog, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
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

interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
  provider: string;
  createdAt: string;
  lastSignInAt: string | null;
  isBanned: boolean;
}

interface PendingAction {
  type: "role" | "ban";
  userId: string;
  email: string;
  newRole?: "admin" | "user";
  newBanned?: boolean;
}

const PAGE_SIZE = 20;

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function ProviderBadge({ provider }: { provider: string }) {
  const map: Record<string, { label: string; className: string }> = {
    google: {
      label: "Google",
      className:
        "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    },
    kakao: {
      label: "Kakao",
      className:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    },
    email: {
      label: "이메일",
      className: "bg-muted text-muted-foreground",
    },
  };
  const config = map[provider] ?? {
    label: provider,
    className: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}

export function UserList() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
  const [processing, setProcessing] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUsers = useCallback(async (p: number, q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(p),
        perPage: String(PAGE_SIZE),
      });
      if (q.trim()) params.set("email", q.trim());

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error("조회 실패");
      const json = await res.json();
      setUsers(json.users ?? []);
      setTotal(json.total ?? 0);
      setPage(p);
    } catch {
      toast.error("사용자 목록 조회에 실패했습니다");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(1, "");
  }, [fetchUsers]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchUsers(1, value);
    }, 400);
  };

  const handleRoleChange = (user: AdminUser, role: "admin" | "user") => {
    if (role === user.role) return;
    setPendingAction({
      type: "role",
      userId: user.id,
      email: user.email,
      newRole: role,
    });
  };

  const handleBanToggle = (user: AdminUser, banned: boolean) => {
    setPendingAction({
      type: "ban",
      userId: user.id,
      email: user.email,
      newBanned: banned,
    });
  };

  const handleConfirm = async () => {
    if (!pendingAction) return;
    setProcessing(true);
    try {
      const body =
        pendingAction.type === "role"
          ? { action: "role", role: pendingAction.newRole }
          : { action: "ban", banned: pendingAction.newBanned };

      const res = await fetch(`/api/admin/users/${pendingAction.userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "요청 실패");
      }

      // 로컬 상태 업데이트
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== pendingAction.userId) return u;
          if (pendingAction.type === "role" && pendingAction.newRole) {
            return { ...u, role: pendingAction.newRole };
          }
          if (
            pendingAction.type === "ban" &&
            pendingAction.newBanned !== undefined
          ) {
            return { ...u, isBanned: pendingAction.newBanned! };
          }
          return u;
        }),
      );

      toast.success(
        pendingAction.type === "role"
          ? `역할이 ${pendingAction.newRole === "admin" ? "관리자" : "일반 사용자"}로 변경되었습니다`
          : pendingAction.newBanned
            ? "계정이 정지되었습니다"
            : "계정 정지가 해제되었습니다",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "처리에 실패했습니다");
    } finally {
      setProcessing(false);
      setPendingAction(null);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* 검색 */}
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="이메일로 검색"
          className="pl-9"
        />
      </div>

      <p className="text-muted-foreground text-sm">
        총 <strong>{total.toLocaleString()}</strong>명
      </p>

      {loading ? (
        <div className="text-muted-foreground py-12 text-center text-sm">
          로딩 중...
        </div>
      ) : users.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed py-12 text-center text-sm">
          사용자가 없습니다
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이메일 / 이름</TableHead>
                <TableHead className="hidden md:table-cell">가입일</TableHead>
                <TableHead className="hidden md:table-cell">
                  마지막 로그인
                </TableHead>
                <TableHead>역할</TableHead>
                <TableHead className="hidden sm:table-cell">
                  프로바이더
                </TableHead>
                <TableHead>계정 정지</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow
                  key={user.id}
                  className={user.isBanned ? "opacity-60" : ""}
                >
                  <TableCell>
                    <div>
                      <p className="max-w-[180px] truncate text-sm font-medium">
                        {user.email}
                      </p>
                      {user.displayName && (
                        <p className="text-muted-foreground text-xs">
                          {user.displayName}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-muted-foreground text-xs">
                      {formatDate(user.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-muted-foreground text-xs">
                      {formatDate(user.lastSignInAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(v) =>
                        handleRoleChange(user, v as "admin" | "user")
                      }
                    >
                      <SelectTrigger className="h-7 w-28 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">
                          <span className="flex items-center gap-1.5">
                            <Users className="h-3 w-3" />
                            일반
                          </span>
                        </SelectItem>
                        <SelectItem value="admin">
                          <span className="flex items-center gap-1.5">
                            <UserCog className="h-3 w-3" />
                            관리자
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <ProviderBadge provider={user.provider} />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={user.isBanned}
                      onCheckedChange={(checked) =>
                        handleBanToggle(user, checked)
                      }
                    />
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
            onClick={() => fetchUsers(page - 1, search)}
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
            onClick={() => fetchUsers(page + 1, search)}
          >
            다음
          </Button>
        </div>
      )}

      {/* 확인 AlertDialog */}
      <AlertDialog
        open={!!pendingAction}
        onOpenChange={() => !processing && setPendingAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.type === "role"
                ? "역할을 변경하시겠습니까?"
                : pendingAction?.newBanned
                  ? "계정을 정지하시겠습니까?"
                  : "계정 정지를 해제하시겠습니까?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{pendingAction?.email}</strong>
              {pendingAction?.type === "role"
                ? ` 사용자의 역할을 ${pendingAction.newRole === "admin" ? "관리자" : "일반 사용자"}로 변경합니다.`
                : pendingAction?.newBanned
                  ? " 사용자의 계정을 정지합니다. 해당 사용자는 로그인할 수 없게 됩니다."
                  : " 사용자의 계정 정지를 해제합니다."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={processing}
              className={
                pendingAction?.type === "ban" && pendingAction.newBanned
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {processing ? "처리 중..." : "확인"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

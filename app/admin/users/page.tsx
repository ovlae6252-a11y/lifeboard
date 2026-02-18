import { Suspense } from "react";
import { connection } from "next/server";
import { Users, UserPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { createAdminClient } from "@/lib/supabase/admin";
import { UserList } from "@/components/admin/user-list";

async function UsersContent() {
  await connection(); // 동적 렌더링 강제 (Supabase Auth Admin API 프리렌더 방지)
  const admin = createAdminClient();

  // 총 사용자 수 조회
  const { data: totalData } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1,
  });
  const totalUsers =
    totalData && "total" in totalData ? (totalData.total ?? 0) : 0;

  // 오늘 가입 수 (최근 100명 중 오늘 가입한 사용자)
  const today = new Date().toISOString().split("T")[0];
  const { data: recentData } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 100,
  });
  const todaySignups =
    recentData?.users.filter((u) => u.created_at.startsWith(today)).length ?? 0;

  const statCards = [
    {
      label: "전체 사용자",
      value: totalUsers.toLocaleString(),
      icon: Users,
      color: "text-primary",
    },
    {
      label: "오늘 가입",
      value: String(todaySignups),
      icon: UserPlus,
      color: "text-muted-foreground",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Icon className={`h-5 w-5 shrink-0 ${color}`} />
                <div>
                  <p className="text-muted-foreground text-xs">{label}</p>
                  <p className="text-2xl font-bold tabular-nums">{value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 사용자 목록 */}
      <UserList />
    </div>
  );
}

function UsersSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="bg-card border-border h-24 rounded-lg border"
          />
        ))}
      </div>
      <div className="bg-muted h-10 rounded" />
      <div className="bg-card border-border h-80 rounded-lg border" />
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">사용자 관리</h1>
        <p className="text-muted-foreground text-sm">
          사용자 역할 및 계정 상태를 관리합니다
        </p>
      </div>

      <Suspense fallback={<UsersSkeleton />}>
        <UsersContent />
      </Suspense>
    </div>
  );
}

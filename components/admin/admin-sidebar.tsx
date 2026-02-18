"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  LayoutDashboard,
  Newspaper,
  Shield,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/admin",
    label: "대시보드",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/admin/news",
    label: "뉴스 관리",
    icon: Newspaper,
    exact: false,
  },
  {
    href: "/admin/moderation",
    label: "콘텐츠 모더레이션",
    icon: Shield,
    exact: false,
  },
  {
    href: "/admin/users",
    label: "사용자 관리",
    icon: Users,
    exact: false,
  },
  {
    href: "/admin/monitoring",
    label: "시스템 모니터링",
    icon: Activity,
    exact: false,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside className="bg-card border-border flex h-screen w-56 flex-col border-r">
      {/* 헤더 */}
      <div className="border-border border-b px-4 py-4">
        <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          관리자
        </p>
        <p className="text-foreground text-sm font-semibold">Lifeboard Admin</p>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navItems.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              isActive(href, exact)
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* 하단: 사이트로 돌아가기 */}
      <div className="border-border border-t px-2 py-4">
        <Link
          href="/protected"
          className="text-muted-foreground hover:bg-accent/50 hover:text-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          사이트로 돌아가기
        </Link>
      </div>
    </aside>
  );
}

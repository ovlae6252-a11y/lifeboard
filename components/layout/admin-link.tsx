import Link from "next/link";
import { isAdmin } from "@/lib/auth/admin";

/** 관리자 역할인 경우에만 관리자 링크를 렌더링하는 Server Component */
export async function AdminLink() {
  const adminUser = await isAdmin();
  if (!adminUser) return null;

  return (
    <Link
      href="/admin"
      className="text-muted-foreground hover:text-foreground text-sm transition-colors"
    >
      관리자
    </Link>
  );
}

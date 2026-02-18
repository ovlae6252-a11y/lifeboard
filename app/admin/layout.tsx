import { Suspense } from "react";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth/admin";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

// getClaims() 비캐시 접근을 Suspense 내부에서 처리 (cacheComponents: true 호환)
async function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const adminUser = await isAdmin();
  if (!adminUser) {
    redirect("/protected");
  }

  return (
    <>
      <AdminSidebar />
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Suspense fallback={null}>
        <AdminAuthGate>{children}</AdminAuthGate>
      </Suspense>
    </div>
  );
}

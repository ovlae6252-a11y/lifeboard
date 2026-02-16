import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export async function HomeCTAButtons() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = !!data?.claims;

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
      <Button asChild size="lg" className="px-8">
        <Link href={isAuthenticated ? "/protected" : "/auth/login"}>
          {isAuthenticated ? "대시보드로 이동" : "시작하기"}
        </Link>
      </Button>
    </div>
  );
}

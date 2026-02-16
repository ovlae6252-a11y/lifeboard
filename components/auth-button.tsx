import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export async function AuthButton() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  return user ? (
    <div className="flex items-center gap-3">
      <span className="text-muted-foreground hidden text-sm sm:inline">
        {user.email}
      </span>
      <LogoutButton />
    </div>
  ) : (
    <Button asChild size="sm" variant="outline">
      <Link href="/auth/login">로그인</Link>
    </Button>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * 개발 전용 이메일/비밀번호 로그인 폼
 * NODE_ENV === 'development'일 때만 표시됨
 */
export function DevLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("test@lifeboard.dev");
  const [password, setPassword] = useState("test1234");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "로그인 실패");
      }

      // 로그인 성공 시 리다이렉트
      router.push("/protected");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인 실패");
    } finally {
      setIsLoading(false);
    }
  };

  // 프로덕션에서는 표시하지 않음
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="border-muted mt-8 border-t pt-8">
      <p className="text-muted-foreground mb-4 text-sm">개발 전용 로그인</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="dev-email">이메일</Label>
          <Input
            id="dev-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="test@lifeboard.dev"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dev-password">비밀번호</Label>
          <Input
            id="dev-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="test1234"
            required
          />
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "로그인 중..." : "이메일 로그인"}
        </Button>
      </form>
    </div>
  );
}

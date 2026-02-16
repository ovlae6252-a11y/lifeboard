import type { User } from "@supabase/supabase-js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ProfileSectionProps {
  user: User;
}

/**
 * 로그인 방식을 한국어로 변환
 */
function getProviderLabel(provider?: string): string {
  if (!provider) return "이메일";

  const labels: Record<string, string> = {
    google: "Google",
    kakao: "Kakao",
    apple: "Apple",
  };

  return labels[provider] || provider;
}

/**
 * 날짜를 한국어 형식으로 포맷 (YYYY년 MM월 DD일)
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${year}년 ${month}월 ${day}일`;
}

export function ProfileSection({ user }: ProfileSectionProps) {
  const provider = user.app_metadata?.provider;
  const providerLabel = getProviderLabel(provider);
  const createdAt = formatDate(user.created_at);

  return (
    <Card>
      <CardHeader>
        <CardTitle>프로필</CardTitle>
        <CardDescription>계정 정보를 확인할 수 있습니다</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <dt className="text-muted-foreground text-sm font-medium">
            로그인 방식
          </dt>
          <dd className="mt-1 text-sm">{providerLabel}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-sm font-medium">이메일</dt>
          <dd className="mt-1 text-sm">{user.email}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-sm font-medium">가입일</dt>
          <dd className="mt-1 text-sm">{createdAt}</dd>
        </div>
      </CardContent>
    </Card>
  );
}

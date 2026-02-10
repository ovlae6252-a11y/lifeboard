import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// 로그인 폼 컴포넌트
// - Server Component로 구현 (상태/이벤트 핸들러 없음, UI만 제공)
// - className prop으로 외부에서 스타일 커스터마이즈 가능
export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        {/* 카드 헤더: 제목과 설명을 중앙 정렬로 표시 */}
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            다시 오신 것을 환영합니다
          </CardTitle>
          <CardDescription>
            이메일과 비밀번호를 입력하여 로그인하세요
          </CardDescription>
        </CardHeader>

        {/* 카드 본문: 이메일/비밀번호 입력 필드와 로그인 버튼 */}
        <CardContent>
          <form>
            <div className="flex flex-col gap-6">
              {/* 이메일 입력 필드 */}
              <div className="grid gap-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </div>

              {/* 비밀번호 입력 필드 */}
              <div className="grid gap-2">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  required
                />
              </div>

              {/* 로그인 버튼: 전체 너비로 표시 */}
              <Button type="submit" className="w-full">
                로그인하기
              </Button>
            </div>

            {/* 하단 안내 텍스트: 회원가입 링크 */}
            <div className="mt-4 text-center text-sm">
              계정이 없으신가요?{" "}
              <a href="#" className="underline underline-offset-4">
                회원가입
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

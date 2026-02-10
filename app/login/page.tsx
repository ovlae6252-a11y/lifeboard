import { LoginForm } from "@/components/login-form"

// 로그인 페이지
// - Header 높이(h-16 = 4rem)를 빼고 남은 영역에서 수직 중앙 정렬
// - max-w-sm(384px)으로 로그인 폼 적정 너비 제한
// - 모바일/데스크톱 반응형 패딩 적용
export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100svh-4rem)] items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}

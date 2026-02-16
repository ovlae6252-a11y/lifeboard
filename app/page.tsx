import { AuthButton } from "@/components/auth-button";
import { Footer } from "@/components/layout/footer";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { HomeCTAButtons } from "@/components/home-cta-buttons";
import { Newspaper, Sparkles, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

const features = [
  {
    icon: Newspaper,
    title: "뉴스 자동 수집",
    description:
      "국내 주요 언론사의 뉴스를 실시간으로 수집하고 중복 기사를 자동으로 그룹핑합니다.",
    delay: "400ms",
  },
  {
    icon: Sparkles,
    title: "AI 팩트 요약",
    description:
      "로컬 AI가 뉴스의 핵심 팩트만 추출하여 빠르게 파악할 수 있도록 요약합니다.",
    delay: "500ms",
  },
  {
    icon: LayoutDashboard,
    title: "통합 대시보드",
    description:
      "카테고리별 뉴스 탐색과 개인화된 대시보드로 필요한 정보를 한눈에 확인합니다.",
    delay: "600ms",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* 헤더 */}
      <nav className="border-border/50 bg-background/80 sticky top-0 z-50 w-full border-b backdrop-blur-xs">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link
            href="/"
            className="font-serif text-lg font-bold tracking-tight"
          >
            Lifeboard
          </Link>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <Suspense>
              <AuthButton />
            </Suspense>
          </div>
        </div>
      </nav>

      {/* 히어로 섹션 */}
      <section className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-24">
        {/* 도트 그리드 배경 패턴 */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle, var(--foreground) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-8 text-center">
          {/* 뱃지 */}
          <div className="animate-fade-in-up border-border bg-secondary/50 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm">
            <Sparkles className="text-accent h-3.5 w-3.5" />
            AI 기반 뉴스 분석 대시보드
          </div>

          {/* 타이틀 */}
          <h1
            className="animate-fade-in-up font-serif text-4xl leading-[1.1] font-bold tracking-tight sm:text-5xl lg:text-6xl"
            style={{ animationDelay: "100ms" }}
          >
            인생의 모든 데이터를
            <br />
            <span className="text-primary">한눈에</span>
          </h1>

          {/* 설명 */}
          <p
            className="animate-fade-in-up text-muted-foreground max-w-md text-lg leading-relaxed"
            style={{ animationDelay: "200ms" }}
          >
            주요 뉴스를 자동으로 수집하고, AI가 핵심만 요약합니다.
            <br className="hidden sm:block" />
            당신만의 라이프 대시보드를 시작하세요.
          </p>

          {/* CTA 버튼 */}
          <Suspense
            fallback={
              <div
                className="animate-fade-in-up"
                style={{ animationDelay: "300ms" }}
              >
                <div className="bg-muted h-10 w-32 animate-pulse rounded-md" />
              </div>
            }
          >
            <HomeCTAButtons />
          </Suspense>
        </div>
      </section>

      {/* 기능 소개 */}
      <section className="border-border/50 bg-secondary/30 border-t">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description, delay }) => (
              <div
                key={title}
                className="animate-fade-in-up border-border/50 bg-card hover:border-border rounded-xl border p-6 transition-colors"
                style={{ animationDelay: delay }}
              >
                <div className="bg-primary/10 mb-4 inline-flex rounded-lg p-2.5">
                  <Icon className="text-primary h-5 w-5" />
                </div>
                <h3 className="mb-2 font-semibold">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <Suspense>
        <Footer />
      </Suspense>
    </div>
  );
}

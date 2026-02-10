import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { config } from "@/lib/config"
import Balancer from "react-wrap-balancer"

export default function Home() {
  return (
    <>
      {/* 히어로 섹션 */}
      <section className="py-24 md:py-32 text-center">
        <div className="container max-w-4xl space-y-8">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            <Balancer>빠르게 시작하는 웹 개발</Balancer>
          </h1>
          <p className="text-lg text-muted-foreground">
            <Balancer>
              Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 + Shadcn/ui
            </Balancer>
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" asChild>
              <a href="#features">시작하기</a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="https://nextjs.org/docs" target="_blank" rel="noopener noreferrer">
                문서 보기
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* 기능 섹션 */}
      <section id="features" className="py-24 bg-muted/50">
        <div className="container max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            주요 기능
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {config.features.map((feature) => (
              <Card key={feature.title} className="p-6 hover:shadow-lg transition-shadow">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section id="cta" className="py-24 bg-primary text-primary-foreground text-center">
        <div className="container max-w-4xl space-y-8">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            <Balancer>지금 바로 시작하세요</Balancer>
          </h2>
          <p className="text-lg opacity-90">
            <Balancer>
              이 스타터킷을 사용하여 프로덕션 레벨의 랜딩 페이지를 빠르게
              구축할 수 있습니다.
            </Balancer>
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="px-12 py-6 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            asChild
          >
            <a href="#features">무료로 시작하기</a>
          </Button>
        </div>
      </section>
    </>
  )
}

import type { Metadata } from "next"
import { Card, CardContent } from "@/components/ui/card"
import { ContactForm } from "@/components/contact-form"
import { config } from "@/lib/config"
import Balancer from "react-wrap-balancer"

export const metadata: Metadata = {
  title: "문의",
  description: config.contact.hero.description,
}

export default function ContactPage() {
  return (
    <>
      {/* 히어로 섹션 */}
      <section className="py-24 md:py-32 text-center">
        <div className="container max-w-4xl space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            <Balancer>{config.contact.hero.title}</Balancer>
          </h1>
          <p className="text-lg text-muted-foreground">
            <Balancer>{config.contact.hero.description}</Balancer>
          </p>
        </div>
      </section>

      {/* 연락처 + 폼 그리드 */}
      <section className="py-24 bg-muted/50">
        <div className="container max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12">
            {/* 연락처 정보 */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">연락처 정보</h2>
              <div className="space-y-4">
                {config.contact.info.map((item) => (
                  <Card key={item.label}>
                    <CardContent className="flex items-center gap-4 p-4">
                      <span className="text-3xl">{item.icon}</span>
                      <div>
                        <p className="text-sm text-muted-foreground">{item.label}</p>
                        <p className="font-medium">{item.value}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* 문의 폼 */}
            <div>
              <h2 className="text-2xl font-bold mb-6">문의 보내기</h2>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

import type { Metadata } from "next"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { PricingCards } from "@/components/pricing-cards"
import { config } from "@/lib/config"
import Balancer from "react-wrap-balancer"

export const metadata: Metadata = {
  title: "가격",
  description: config.pricing.hero.description,
}

export default function PricingPage() {
  return (
    <>
      {/* 히어로 섹션 */}
      <section className="py-24 md:py-32 text-center">
        <div className="container max-w-4xl space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            <Balancer>{config.pricing.hero.title}</Balancer>
          </h1>
          <p className="text-lg text-muted-foreground">
            <Balancer>{config.pricing.hero.description}</Balancer>
          </p>
        </div>
      </section>

      {/* 가격 카드 섹션 */}
      <section className="py-24 bg-muted/50">
        <div className="container max-w-6xl">
          <PricingCards />
        </div>
      </section>

      {/* FAQ 섹션 */}
      <section className="py-24">
        <div className="container max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            자주 묻는 질문
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {config.pricing.faq.map((item, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground">{item.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </>
  )
}

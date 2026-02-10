"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { config } from "@/lib/config"

export function PricingCards() {
  // 월간/연간 토글 상태
  const [isYearly, setIsYearly] = useState(false)

  return (
    <div className="space-y-8">
      {/* 월간/연간 토글 */}
      <div className="flex items-center justify-center gap-3">
        <Label htmlFor="billing-toggle" className="text-sm">월간</Label>
        <Switch
          id="billing-toggle"
          checked={isYearly}
          onCheckedChange={setIsYearly}
        />
        <Label htmlFor="billing-toggle" className="text-sm">
          연간 <span className="text-primary font-semibold">(-17%)</span>
        </Label>
      </div>

      {/* 가격 카드 3단 */}
      <div className="grid md:grid-cols-3 gap-8">
        {config.pricing.plans.map((plan) => (
          <Card
            key={plan.name}
            className={`relative flex flex-col ${
              plan.highlighted ? "border-primary shadow-lg scale-105" : ""
            }`}
          >
            {/* 추천 배지 */}
            {"badge" in plan && plan.badge && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                {plan.badge}
              </Badge>
            )}

            <CardHeader>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>

            <CardContent className="flex-1 space-y-6">
              {/* 가격 표시 */}
              <div>
                <span className="text-4xl font-bold">
                  {isYearly
                    ? plan.price.yearly === 0 ? "무료" : `₩${plan.price.yearly.toLocaleString()}`
                    : plan.price.monthly === 0 ? "무료" : `₩${plan.price.monthly.toLocaleString()}`
                  }
                </span>
                {plan.price.monthly > 0 && (
                  <span className="text-muted-foreground text-sm ml-1">
                    /{isYearly ? "년" : "월"}
                  </span>
                )}
              </div>

              <Separator />

              {/* 기능 목록 */}
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <span className="text-primary">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              <Button
                className="w-full"
                variant={plan.highlighted ? "default" : "outline"}
              >
                {plan.cta}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

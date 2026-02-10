import type { Metadata } from "next"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { config } from "@/lib/config"
import Balancer from "react-wrap-balancer"

export const metadata: Metadata = {
  title: "소개",
  description: config.about.hero.description,
}

export default function AboutPage() {
  return (
    <>
      {/* 히어로 섹션 */}
      <section className="py-24 md:py-32 text-center">
        <div className="container max-w-4xl space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            <Balancer>{config.about.hero.title}</Balancer>
          </h1>
          <p className="text-lg text-muted-foreground">
            <Balancer>{config.about.hero.description}</Balancer>
          </p>
        </div>
      </section>

      {/* 미션 섹션 */}
      <section className="py-24 bg-muted/50">
        <div className="container max-w-4xl text-center space-y-6">
          <Badge variant="secondary">{config.about.mission.title}</Badge>
          <p className="text-lg leading-relaxed text-muted-foreground">
            <Balancer>{config.about.mission.description}</Balancer>
          </p>
        </div>
      </section>

      {/* 핵심 가치 섹션 */}
      <section className="py-24">
        <div className="container max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            핵심 가치
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {config.about.values.map((value) => (
              <Card key={value.title} className="p-6 text-center">
                <div className="text-5xl mb-4">{value.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Separator className="max-w-6xl mx-auto" />

      {/* 팀 소개 섹션 */}
      <section className="py-24">
        <div className="container max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            팀 소개
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {config.about.team.map((member) => (
              <Card key={member.name} className="p-6 text-center">
                <CardContent className="flex flex-col items-center gap-4 p-0">
                  <Avatar className="size-16" size="lg">
                    <AvatarFallback className="text-lg">{member.avatar}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{member.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{member.role}</p>
                    <p className="text-sm text-muted-foreground">{member.bio}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

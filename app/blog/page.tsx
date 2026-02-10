import type { Metadata } from "next"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { config } from "@/lib/config"
import Balancer from "react-wrap-balancer"

export const metadata: Metadata = {
  title: "블로그",
  description: config.blog.hero.description,
}

export default function BlogPage() {
  return (
    <>
      {/* 히어로 섹션 */}
      <section className="py-24 md:py-32 text-center">
        <div className="container max-w-4xl space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            <Balancer>{config.blog.hero.title}</Balancer>
          </h1>
          <p className="text-lg text-muted-foreground">
            <Balancer>{config.blog.hero.description}</Balancer>
          </p>
        </div>
      </section>

      {/* 포스트 그리드 */}
      <section className="py-24 bg-muted/50">
        <div className="container max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8">
            {config.blog.posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`}>
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex gap-2 mb-2">
                      {post.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                    <CardTitle className="text-xl">{post.title}</CardTitle>
                    <CardDescription>{post.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <Avatar size="sm">
                        <AvatarFallback className="text-xs">
                          {post.author.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{post.author.name}</span>
                        <span>·</span>
                        <span>{post.date}</span>
                        <span>·</span>
                        <span>{post.readingTime} 읽기</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

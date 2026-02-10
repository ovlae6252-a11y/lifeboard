import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { config } from "@/lib/config"

// 정적 경로 생성 (빌드 시 모든 블로그 경로를 미리 생성)
export function generateStaticParams() {
  return config.blog.posts.map((post) => ({
    slug: post.slug,
  }))
}

// 동적 메타데이터 생성
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = config.blog.posts.find((p) => p.slug === slug)
  if (!post) return {}

  return {
    title: post.title,
    description: post.description,
  }
}

// 마크다운 문자열을 간단히 렌더링하는 헬퍼
function renderContent(content: string) {
  return content.split("\n").map((line, i) => {
    const trimmed = line.trim()

    // ## 제목
    if (trimmed.startsWith("## ")) {
      return (
        <h2 key={i} className="text-2xl font-bold mt-8 mb-4">
          {trimmed.slice(3)}
        </h2>
      )
    }

    // 빈 줄은 무시
    if (trimmed === "") return null

    // 일반 텍스트
    return (
      <p key={i} className="text-muted-foreground leading-relaxed mb-4">
        {trimmed}
      </p>
    )
  })
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  // Next.js 16에서는 params가 Promise이므로 await 필요
  const { slug } = await params
  const post = config.blog.posts.find((p) => p.slug === slug)

  if (!post) {
    notFound()
  }

  return (
    <article className="py-24">
      <div className="container max-w-3xl">
        {/* 뒤로가기 */}
        <Button variant="ghost" asChild className="mb-8">
          <Link href="/blog">← 블로그로 돌아가기</Link>
        </Button>

        {/* 제목 + 메타 */}
        <div className="space-y-4 mb-8">
          <div className="flex gap-2">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            {post.title}
          </h1>
          <div className="flex items-center gap-3">
            <Avatar size="sm">
              <AvatarFallback className="text-xs">{post.author.avatar}</AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{post.author.name}</span>
              <span>·</span>
              <span>{post.date}</span>
              <span>·</span>
              <span>{post.readingTime} 읽기</span>
            </div>
          </div>
        </div>

        <Separator className="mb-8" />

        {/* 본문 */}
        <div className="prose-custom">
          {renderContent(post.content)}
        </div>

        <Separator className="my-12" />

        {/* 저자 카드 */}
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <Avatar className="size-12" size="lg">
              <AvatarFallback className="text-lg">{post.author.avatar}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{post.author.name}</p>
              <p className="text-sm text-muted-foreground">
                이 글이 도움이 되었다면 다른 글도 확인해보세요.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </article>
  )
}

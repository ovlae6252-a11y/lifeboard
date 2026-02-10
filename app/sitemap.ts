import type { MetadataRoute } from "next"
import { config } from "@/lib/config"

export default function sitemap(): MetadataRoute.Sitemap {
  // 정적 페이지 목록
  const staticPages = [
    "",
    "/about",
    "/pricing",
    "/contact",
    "/blog",
  ]

  // 블로그 포스트 URL 목록
  const blogPages = config.blog.posts.map((post) => `/blog/${post.slug}`)

  // 모든 URL을 합쳐서 사이트맵 생성
  return [...staticPages, ...blogPages].map((path) => ({
    url: `${config.url}${path}`,
    lastModified: new Date(),
  }))
}

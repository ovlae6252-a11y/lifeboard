"use client"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { MobileMenu } from "@/components/mobile-menu"
import { config } from "@/lib/config"

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container flex h-16 max-w-7xl items-center justify-between">
        {/* 로고 */}
        <a href="/" className="font-bold text-xl">
          {config.name}
        </a>

        {/* 데스크톱 메뉴 */}
        <div className="hidden md:flex gap-6">
          {config.nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.title}
            </a>
          ))}
        </div>

        {/* 우측 메뉴 (테마 토글 + 모바일 메뉴) */}
        <div className="flex gap-2 items-center">
          <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
            <a href="/login">로그인</a>
          </Button>
          <ThemeToggle />
          <MobileMenu />
        </div>
      </nav>
    </header>
  )
}

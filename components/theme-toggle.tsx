"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  // 하이드레이션 오류를 방지하기 위해 마운트 후에만 렌더링
  useEffect(() => {
    setMounted(true)

    // 백업: 2초 후에도 마운트되지 않으면 강제 마운트
    const timeout = setTimeout(() => {
      setMounted(true)
    }, 2000)

    return () => clearTimeout(timeout)
  }, [])

  if (!mounted) {
    return <Button variant="ghost" size="icon" disabled />
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      aria-label="토글 다크 모드"
    >
      {theme === "light" ? "🌙" : "☀️"}
    </Button>
  )
}

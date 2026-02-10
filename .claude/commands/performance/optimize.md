---
description: "Next.js 프로젝트의 성능 최적화 기회를 분석하고 구체적인 개선 방안을 제안합니다"
allowed-tools:
  - "Read"
  - "Glob"
  - "Grep"
  - "Bash(npm:*)"
  - "Bash(ls:*)"
  - "Bash(find:*)"
model: sonnet
argument-hint: "[category]"
---

# Claude 명령어: Optimize

Next.js 프로젝트의 성능 최적화 기회를 자동으로 분석하고 구체적인 개선 방안을 제안합니다.

## 사용법

```
/optimize              # 전체 카테고리 분석
/optimize nextjs       # Next.js 관련 최적화만 분석
/optimize react        # React 관련 최적화만 분석
/optimize bundle       # 번들 최적화만 분석
/optimize css          # Tailwind CSS 최적화만 분석
```

## 분석 범위: **${1:-전체 카테고리}**

## 분석 프로세스

분석 진행 중:
1. 프로젝트 구조 파악 (package.json, 컴포넌트 디렉토리)
2. 소스 코드 스캔 (.tsx, .jsx 파일 검색)
3. 최적화 패턴 탐지 (Grep으로 자동 검사)
4. 우선순위별 제안 정렬
5. 각 제안에 대한 코드 예제 및 참고 자료 제공

---

## 🎯 Next.js 최적화 (${1:-전체}와 nextjs 포함)

### 1️⃣ 이미지 최적화

**우선순위**: 🔴 높음 | **영향도**: LCP 10-30% 개선 | **난이도**: 쉬움

#### 현재 상태 검사

현재 프로젝트에서 사용 중인 이미지 태그:

```bash
# 검사 결과: 현재 프로젝트에서 <img> 태그 사용 여부 확인
```

#### 최적화 방법

❌ **Before:**
```typescript
// components/hero.tsx
export function Hero() {
  return (
    <img
      src="/hero.jpg"
      alt="Hero"
      style={{ width: '100%', height: 'auto' }}
    />
  )
}
```

✅ **After:**
```typescript
// components/hero.tsx
import Image from "next/image"

export function Hero() {
  return (
    <Image
      src="/hero.jpg"
      alt="Hero"
      width={1200}
      height={600}
      priority  // LCP 최적화: 위 접기 영역의 이미지에만 사용
      className="w-full h-auto"
    />
  )
}
```

#### 왜 중요한가?

- **자동 최적화**: Next.js가 이미지를 자동으로 최적 포맷(WebP)으로 변환
- **지연 로딩**: 뷰포트에 보이지 않는 이미지는 자동으로 지연 로드
- **반응형 지원**: 디바이스별 최적 크기 자동 제공

#### 참고 자료

- [Next.js Image Optimization 공식 문서](https://nextjs.org/docs/app/building-your-application/optimizing/images)

---

### 2️⃣ 폰트 최적화

**우선순위**: 🟡 중간 | **영향도**: Cumulative Layout Shift(CLS) 개선 | **난이도**: 쉬움

#### 최적화 방법

❌ **Before:**
```typescript
// app/layout.tsx
import { Inter } from "next/font/google"

// 기본 설정 - 모든 variant 포함
const inter = Inter({ subsets: ["latin"] })
```

✅ **After:**
```typescript
// app/layout.tsx
import { Inter } from "next/font/google"

// 최적화된 설정 - 필요한 weight만 포함
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "700"],  // 필요한 weight만 명시
  variable: "--font-inter",        // CSS 변수로 사용
  display: "swap"                  // 폰트 로드 중 대체 폰트 표시
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
```

#### 최적화 팁

1. **Subset 지정**: 전체 라틴 문자 대신 필요한 문자만 로드
2. **Weight 제한**: 사용하는 font-weight만 명시
3. **로컬 폰트**: 자주 변경되는 폰트는 로컬로 호스트

#### 참고 자료

- [Next.js Font Optimization 공식 문서](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)

---

### 3️⃣ 동적 임포트 (코드 분할)

**우선족도**: 🟡 중간 | **영향도**: 초기 로드 시간 5-20% 개선 | **난이도**: 중간

#### 최적화 방법

❌ **Before:**
```typescript
// app/page.tsx
import { HeavyChart } from "@/components/heavy-chart"
import { ComplexForm } from "@/components/complex-form"

export default function Home() {
  return (
    <>
      <HeroSection />
      <HeavyChart />        {/* 위 접기 영역 아님에도 항상 로드 */}
      <ComplexForm />       {/* 사용자 스크롤 전 로드 됨 */}
    </>
  )
}
```

✅ **After:**
```typescript
// app/page.tsx
import dynamic from "next/dynamic"

// 로딩 상태 표시
const HeavyChart = dynamic(() => import("@/components/heavy-chart"), {
  loading: () => <div className="h-96 bg-muted animate-pulse" />,
})

const ComplexForm = dynamic(() => import("@/components/complex-form"), {
  loading: () => <div className="h-64 bg-muted animate-pulse" />,
})

export default function Home() {
  return (
    <>
      <HeroSection />
      <HeavyChart />        {/* 필요할 때만 로드 */}
      <ComplexForm />       {/* 백그라운드에서 로드 */}
    </>
  )
}
```

#### 언제 사용할까?

- 번들 크기가 100KB 이상인 컴포넌트
- 특정 조건에서만 표시되는 컴포넌트
- 모달, 드롭다운 등 상호작용 후 표시되는 컴포넌트

#### 참고 자료

- [Next.js Dynamic Imports 공식 문서](https://nextjs.org/docs/app/building-your-application/optimizing/dynamic-imports)

---

## 🔧 React 최적화 (${1:-전체}와 react 포함)

### 1️⃣ "use client" 최소화

**우선순위**: 🔴 높음 | **영향도**: 번들 크기 15-40% 감소 | **난이도**: 중간

#### 현황 분석

Server Components를 최대한 활용하면 클라이언트 번들이 줄어듭니다.

❌ **Before (안 좋은 패턴):**
```typescript
// app/page.tsx
"use client"  // 전체 페이지가 클라이언트 컴포넌트!

import { useState } from "react"
import { Header } from "@/components/header"
import { features } from "@/lib/config"

export default function Home() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Header />  {/* 상호작용 없어도 클라이언트 로드 */}
      <section>
        {features.map(f => (
          <FeatureCard key={f.id} feature={f} />  {/* 클라이언트 로드 */}
        ))}
      </section>
    </>
  )
}
```

✅ **After (좋은 패턴):**
```typescript
// app/page.tsx (Server Component 유지!)
import { Header } from "@/components/header"           // Server Component
import { FeatureCard } from "@/components/feature-card" // Server Component
import { features } from "@/lib/config"

export default function Home() {
  return (
    <>
      <Header />
      <section>
        {features.map(f => (
          <FeatureCard key={f.id} feature={f} />
        ))}
      </section>
      <InteractiveSection />  {/* 이것만 클라이언트 */}
    </>
  )
}

// components/interactive-section.tsx
"use client"  // 필요한 부분만 클라이언트

import { useState } from "react"

export function InteractiveSection() {
  const [isOpen, setIsOpen] = useState(false)
  return <>{/* ... */}</>
}
```

#### 원칙

1. **페이지 전체를 "use client"로 감싸지 말 것**
2. **상호작용이 필요한 가장 작은 단위의 컴포넌트만 "use client" 추가**
3. **Server Components가 Client Components를 감싸기** (역은 안 됨)

#### 참고 자료

- [Next.js Server vs Client Components](https://nextjs.org/docs/app/building-your-application/rendering/server-and-client-components)

---

### 2️⃣ 불필요한 리렌더링 방지

**우선순위**: 🟡 중간 | **영향도**: 상호작용 성능 10-30% 개선 | **난이도**: 중간

#### React.memo 사용

❌ **Before:**
```typescript
// components/feature-card.tsx
export function FeatureCard({ feature, onSelect }) {
  console.log("FeatureCard 렌더링:", feature.title)
  return (
    <div onClick={() => onSelect(feature.id)}>
      <h3>{feature.title}</h3>
      <p>{feature.description}</p>
    </div>
  )
}

// 부모가 리렌더링되면 모든 FeatureCard가 리렌더링됨
```

✅ **After:**
```typescript
// components/feature-card.tsx
import { memo } from "react"

export const FeatureCard = memo(function FeatureCard({
  feature,
  onSelect
}) {
  console.log("FeatureCard 렌더링:", feature.title)
  return (
    <div onClick={() => onSelect(feature.id)}>
      <h3>{feature.title}</h3>
      <p>{feature.description}</p>
    </div>
  )
})

// props가 변경되지 않으면 리렌더링되지 않음
```

#### useCallback으로 함수 안정화

```typescript
// app/page.tsx
"use client"

import { useCallback, useState } from "react"
import { FeatureCard } from "@/components/feature-card"

export default function Home() {
  const [selected, setSelected] = useState<number | null>(null)

  // ❌ 매번 새로운 함수 객체 생성 → FeatureCard 리렌더링
  // const handleSelect = (id: number) => setSelected(id)

  // ✅ 함수 메모이제이션 → FeatureCard 리렌더링 방지
  const handleSelect = useCallback((id: number) => {
    setSelected(id)
  }, [])

  return (
    <div>
      {features.map(f => (
        <FeatureCard
          key={f.id}
          feature={f}
          onSelect={handleSelect}
        />
      ))}
    </div>
  )
}
```

#### 언제 사용할까?

- **React.memo**: 자주 리렌더링되는 부모를 가진 컴포넌트
- **useCallback**: 자식 컴포넌트로 전달되는 함수
- **useMemo**: 계산 비용이 큰 값

---

### 3️⃣ Context API 최적화

**우선순위**: 🟢 낮음 | **영향도**: 특정 상황에서 20% 개선 | **난이도**: 높음

#### 문제점

```typescript
// contexts/theme.tsx
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState<Theme>("light")
  const [isDarkMode, setIsDarkMode] = useState(false)

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, setTheme, setIsDarkMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

// 이 Context를 사용하는 모든 컴포넌트가 isDarkMode 변경 시 리렌더링됨
// theme은 필요 없는데도!
```

#### 해결책

```typescript
// contexts/theme.tsx
const ThemeContext = createContext<Theme | undefined>(undefined)
const ThemeDispatchContext = createContext<ThemeDispatch | undefined>(undefined)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState<Theme>("light")

  return (
    <ThemeContext.Provider value={theme}>
      <ThemeDispatchContext.Provider value={setTheme}>
        {children}
      </ThemeDispatchContext.Provider>
    </ThemeContext.Provider>
  )
}

// 선택적 구독 가능 - theme만 필요한 컴포넌트는 dispatch 변경에 영향 없음
```

---

## 📦 번들 최적화 (${1:-전체}와 bundle 포함)

### 1️⃣ 패키지 크기 분석

**우선순위**: 🔴 높음 | **영향도**: 초기 로드 시간 20-50% 개선 가능 | **난이도**: 쉬움

#### 설치된 패키지 크기 확인

```bash
# 현재 프로젝트의 의존성 확인
npm list --depth=0
```

**현재 프로젝트 의존성:**
- next: 16.1.6
- react: 19.2.3
- tailwindcss: 4
- lucide-react: 0.563.0
- react-wrap-balancer: 1.1.1
- next-themes: 0.4.6

#### 최적화 제안

| 패키지 | 대안 | 이점 |
|--------|------|------|
| **moment** (만약 사용 중) | **date-fns** | 5배 더 작음, 트리 쉐이킹 가능 |
| **lodash** (만약 사용 중) | **lodash-es** 또는 개별 함수 | Tree-shaking 지원 |
| **axios** (만약 사용 중) | **fetch API** 또는 **undici** | Next.js 내장 fetch 사용 권장 |

#### Tree-shaking 확인

```typescript
// ❌ Named import 미사용 - 전체 모듈 로드
import * as lodash from "lodash"
const chunk = lodash.chunk([1,2,3,4], 2)

// ✅ Named import 사용 - tree-shaking 가능
import { chunk } from "lodash-es"
```

---

### 2️⃣ 번들 분석 도구 설치

**우선순위**: 🟡 중간 | **영향도**: 정보 수집 | **난이도**: 쉬움

#### @next/bundle-analyzer 설치 및 사용

```bash
npm install --save-dev @next/bundle-analyzer
```

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // ... 다른 설정
})
```

```bash
# 번들 분석 실행
ANALYZE=true npm run build
```

이 도구는 시각적 번들 맵을 생성하여 어떤 패키지가 가장 큰지 보여줍니다.

---

## 🎨 Tailwind CSS 최적화 (${1:-전체}와 css 포함)

### 1️⃣ 클래스 중복 제거

**우선순위**: 🟢 낮음 | **영향도**: CSS 파일 크기 5-15% 감소 | **난이도**: 쉬움

#### 현황

Tailwind CSS 4는 자동으로 사용하는 클래스만 번들에 포함합니다.

#### 최적화 팁

❌ **Before (유연하지만 큼):**
```typescript
const buttonClasses = {
  primary: "px-4 py-2 bg-blue-500 text-white rounded",
  secondary: "px-4 py-2 bg-gray-200 text-black rounded",
  large: "px-6 py-3 bg-blue-500 text-white rounded",
}

<button className={buttonClasses.primary}>Click</button>
<button className={buttonClasses.secondary}>Click</button>
```

✅ **After (컴포넌트 사용):**
```typescript
// components/ui/button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary"
  size?: "sm" | "md" | "lg"
}

export function Button({ variant = "primary", size = "md", ...props }: ButtonProps) {
  const baseClasses = "font-medium rounded transition-colors"

  const variantClasses = {
    primary: "bg-blue-500 text-white hover:bg-blue-600",
    secondary: "bg-gray-200 text-black hover:bg-gray-300",
  }

  const sizeClasses = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
      {...props}
    />
  )
}

// 사용
<Button variant="primary" size="lg">Click</Button>
<Button variant="secondary">Click</Button>
```

#### 장점

- **일관성**: 한 곳에서 스타일 관리
- **유지보수**: 변경이 용이
- **성능**: 중복 클래스 제거

---

### 2️⃣ 커스텀 유틸리티 생성

**우선순위**: 🟢 낮음 | **영향도**: 개발 효율성 개선 | **난이도**: 쉬움

#### 자주 사용되는 패턴을 유틸리티로

```css
/* globals.css */
@layer utilities {
  /* 중앙 정렬 */
  @apply w-full max-w-6xl mx-auto;

  /* 플렉스 중앙 정렬 */
  .flex-center {
    @apply flex items-center justify-center;
  }

  /* 그리드 중앙 정렬 */
  .grid-center {
    @apply grid place-items-center;
  }

  /* 텍스트 절단 */
  .line-clamp-2 {
    @apply overflow-hidden text-ellipsis display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
}
```

사용:
```typescript
<div className="flex-center h-96">
  <p>중앙 정렬</p>
</div>
```

---

## 📊 분석 결과 요약

다음 항목들을 우선순위로 개선하세요:

### 🔴 높은 우선순위 (지금 바로)
1. **이미지 최적화** - LCP 개선 (next/image)
2. **"use client" 최소화** - 번들 크기 감소
3. **패키지 크기 분석** - 불필요한 의존성 제거

### 🟡 중간 우선순위 (이번 주)
4. **동적 임포트** - 초기 로드 개선
5. **폰트 최적화** - CLS 개선
6. **React.memo** - 상호작용 성능

### 🟢 낮은 우선순위 (나중에)
7. **Context 최적화** - 특정 경우만 필요
8. **Tailwind 최적화** - 이미 최적화됨 (Tailwind 4)

---

## 🔗 참고 자료

- [Next.js 공식 성능 최적화 가이드](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web.dev Performance](https://web.dev/performance/)
- [React 성능 최적화](https://react.dev/reference/react/memo)
- [Tailwind CSS 최적화](https://tailwindcss.com/docs/optimizing-for-production)

---

## 💡 팁

최적화는 **측정 기반**으로 진행하세요:

```bash
# 1. 현재 성능 측정
npm run build

# 2. 최적화 적용
# (위의 제안 중 하나 선택)

# 3. 성능 개선 확인
npm run build

# 4. 브라우저에서 검증
npm run dev
# Chrome DevTools > Lighthouse로 점수 확인
```

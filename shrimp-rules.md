# Development Guidelines

## 프로젝트 개요

- **라이프보드(Lifeboard)**: 뉴스 수집 + AI 팩트 요약 대시보드
- **기술 스택**: Next.js 16 (App Router) + React 19 + TypeScript strict + Supabase SSR + Tailwind CSS 3 + shadcn/ui (new-york)
- **현재 상태**: Supabase Starter Kit 기반, 인증 완성, MVP 개발 시작 단계
- **참조 문서**: `docs/PRD.md` (기능 명세), `docs/ROADMAP.md` (개발 단계), `docs/LEANCANVAS.md` (비즈니스 모델)

---

## 디렉토리 구조 및 역할

| 디렉토리/파일 | 역할 | 수정 시 주의사항 |
|---|---|---|
| `app/layout.tsx` | 루트 레이아웃 (ThemeProvider, 폰트, 메타데이터) | 전역 영향, 신중히 수정 |
| `app/page.tsx` | 공개 홈 페이지 | 미인증 사용자 접근 가능 |
| `app/globals.css` | Tailwind + HSL CSS 변수 (라이트/다크) | `:root`와 `.dark` 항상 동시 수정 |
| `app/auth/*` | 인증 플로우 페이지 | `proxy.ts` 화이트리스트에 포함됨 |
| `app/protected/*` | 인증 필요 페이지 | 새 페이지는 반드시 이 하위에 생성 |
| `app/protected/layout.tsx` | 인증 영역 레이아웃 (네비게이션, 푸터) | 새 메뉴 추가 시 이 파일 수정 |
| `components/ui/` | shadcn/ui 기본 컴포넌트 | **직접 수정 금지**, CLI로만 관리 |
| `components/` | 프로젝트 커스텀 컴포넌트 | 새 컴포넌트는 여기에 생성 |
| `lib/supabase/server.ts` | Server Component/Action용 클라이언트 | 요청마다 새 인스턴스 생성 필수 |
| `lib/supabase/client.ts` | Client Component용 브라우저 클라이언트 | `NEXT_PUBLIC_` 환경 변수 사용 |
| `lib/supabase/proxy.ts` | Middleware용 세션 갱신 클라이언트 | `supabaseResponse` 객체 변조 금지 |
| `lib/utils.ts` | 유틸리티 (`cn()`, `hasEnvVars`) | 공통 헬퍼 추가 위치 |
| `proxy.ts` | Next.js Middleware (세션 + 리다이렉트) | 공개 경로 추가 시 화이트리스트 수정 |
| `CLAUDE.md` | AI Agent 개발 가이드라인 | 아키텍처 변경 시 동기화 |

### Starter Kit 잔여 컴포넌트 (제거 대상)

- `components/hero.tsx`, `components/deploy-button.tsx`, `components/env-var-warning.tsx`
- `components/next-logo.tsx`, `components/supabase-logo.tsx`
- `components/tutorial/` 폴더 전체
- **새 기능에 이 컴포넌트들을 재사용하지 마라**
- 제거 시 `app/page.tsx`의 import 참조를 반드시 확인하라

---

## 코딩 규칙

### 언어 규칙

| 대상 | 언어 |
|---|---|
| 변수명, 함수명, 파일명 | 영어 |
| 주석 | 한국어 |
| 커밋 메시지 | 한국어 |
| 문서 | 한국어 |

### 포맷 규칙

- 들여쓰기: **2칸 스페이스**
- 경로 import: `@/*` 별칭 사용 (상대 경로 `../../` 금지)
- TypeScript strict 모드 준수

```typescript
// DO
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

// DON'T
import { Button } from "../../components/ui/button";
import { createClient } from "../../lib/supabase/server";
```

---

## Supabase 클라이언트 사용 규칙

### 클라이언트 선택 기준

| 컨텍스트 | 사용할 클라이언트 | import 경로 |
|---|---|---|
| Server Component | `createClient()` | `@/lib/supabase/server` |
| Server Action | `createClient()` | `@/lib/supabase/server` |
| Route Handler | `createClient()` | `@/lib/supabase/server` |
| Client Component | `createClient()` | `@/lib/supabase/client` |
| Middleware | `updateSession()` | `@/lib/supabase/proxy` |

### 서버 클라이언트 규칙

```typescript
// DO: 함수 내부에서 매번 새로 생성
export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
}

// DON'T: 전역 변수로 캐시
const supabase = await createClient(); // 금지!
export default async function Page() {
  const { data } = await supabase.auth.getClaims();
}
```

### 인증 상태 확인

```typescript
// DO: getClaims() 사용 (빠름, JWT 토큰만 검증)
const { data: { claims } } = await supabase.auth.getClaims();

// DON'T: getUser() 사용 (매번 Supabase API 호출, 느림)
const { data: { user } } = await supabase.auth.getUser();
```

---

## 컴포넌트 개발 규칙

### Server vs Client Component 결정

- **Server Component (기본)**: 데이터 표시만 하는 컴포넌트
- **Client Component (`"use client"`)**: 아래 조건 중 하나라도 해당 시
  - `useState`, `useEffect`, `useRef` 등 React hooks 사용
  - `onClick`, `onChange` 등 이벤트 핸들러
  - 브라우저 API 접근 (localStorage, window 등)
  - 폼 입력 처리

### shadcn/ui 컴포넌트 관리

```bash
# DO: CLI로 추가
npx shadcn@latest add button
npx shadcn@latest add card

# DON'T: components/ui/ 파일 직접 생성하거나 수정
```

- `components/ui/` 내 파일은 shadcn CLI가 관리한다
- 커스터마이징이 필요하면 래퍼 컴포넌트를 `components/`에 생성하라
- 아이콘은 `lucide-react` 패키지를 사용하라

### 새 컴포넌트 생성 위치

| 유형 | 위치 |
|---|---|
| shadcn/ui 기본 컴포넌트 | `components/ui/` (CLI로만 추가) |
| 프로젝트 공통 컴포넌트 | `components/` |
| 특정 페이지 전용 컴포넌트 | 해당 라우트 폴더 또는 `components/` |

---

## 스타일링 규칙

### CSS 변수 사용 필수

```tsx
// DO: CSS 변수 사용
<div className="bg-background text-foreground" />
<div className="bg-primary text-primary-foreground" />
<div className="border-border" />

// DON'T: 색상 하드코딩
<div className="bg-white text-black" />
<div className="bg-[#3b82f6]" />
<div style={{ color: '#333' }} />
```

### CSS 변수 추가 시

1. `app/globals.css`의 `:root` 블록에 라이트 모드 값 추가
2. `app/globals.css`의 `.dark` 블록에 다크 모드 값 추가
3. 필요 시 `tailwind.config.ts`의 `theme.extend.colors`에 매핑 추가

```css
/* 반드시 라이트/다크 양쪽 모두 정의 */
:root {
  --custom-color: 210 40% 96%;
}
.dark {
  --custom-color: 210 40% 20%;
}
```

### 다크 모드

- `next-themes` 라이브러리, class 전략 사용
- `ThemeSwitcher` 컴포넌트로 전환 (`components/theme-switcher.tsx`)
- 모든 UI는 라이트/다크 양쪽에서 정상 표시되는지 확인하라

---

## 라우팅 및 미들웨어 규칙

### 라우트 구조

```
/                    → 공개 (미인증 접근 가능)
/auth/*              → 인증 플로우 (미인증 접근 가능)
/protected/*         → 인증 필요 (미인증 시 /auth/login 리다이렉트)
```

### 새 페이지 추가 워크플로우

**인증 필요 페이지:**
1. `app/protected/<route>/page.tsx` 생성
2. `app/protected/layout.tsx`에 네비게이션 링크 추가
3. 미들웨어가 자동으로 인증 체크 처리

**공개 페이지:**
1. `app/<route>/page.tsx` 생성
2. `proxy.ts`의 미들웨어 화이트리스트에 경로 추가 필수
3. 화이트리스트 미추가 시 미인증 사용자가 `/auth/login`으로 리다이렉트됨

### 미들웨어 수정 규칙

- `proxy.ts`의 `updateSession()` 함수 내 `supabaseResponse` 객체를 임의로 변조하지 마라
- 공개 경로 추가 시 조건문의 경로 목록만 수정하라
- 미들웨어 matcher 패턴 변경 시 정적 자산 경로(`_next/static`, `_next/image`, `favicon.ico`)를 유지하라

---

## 파일 상호작용 규칙

### 동시 수정이 필요한 파일 조합

| 작업 | 수정 필요 파일 |
|---|---|
| 새 인증 필요 페이지 추가 | `app/protected/<route>/page.tsx` + `app/protected/layout.tsx` (네비 링크) |
| 새 공개 페이지 추가 | `app/<route>/page.tsx` + `proxy.ts` (화이트리스트) |
| CSS 변수 추가 | `app/globals.css` (`:root` + `.dark`) + (선택) `tailwind.config.ts` |
| 환경 변수 추가 | `.env.local` + `CLAUDE.md` (문서화) |
| Supabase 테이블 추가 | 마이그레이션 SQL + TypeScript 타입 정의 + RLS 정책 |
| shadcn/ui 컴포넌트 추가 | CLI 실행 → `components/ui/` 자동 생성 (수동 작업 없음) |
| Starter Kit 컴포넌트 제거 | 컴포넌트 파일 삭제 + `app/page.tsx` import 제거 |

---

## 새 기능 구현 워크플로우

1. `docs/PRD.md`에서 해당 기능 요구사항(F코드) 확인
2. `docs/ROADMAP.md`에서 해당 Phase/Milestone 확인
3. 필요한 Supabase 테이블이 있으면 마이그레이션 SQL 작성 + RLS 정책 설정
4. Server Component로 데이터 패칭 레이어 구현
5. Client Component로 사용자 인터랙션 구현 (필요 시)
6. shadcn/ui 컴포넌트 활용 (CLI로 추가)
7. 라우팅 설정 (`protected/` 또는 공개)
8. 라이트/다크 모드 양쪽 UI 확인
9. `ROADMAP.md` 체크박스 업데이트

---

## AI 의사결정 기준

### 컴포넌트 유형 결정

```
사용자 인터랙션 필요?
├── YES → Client Component ("use client")
│   ├── 폼 입력 → useState + Client Component
│   ├── 클릭/토글 → onClick 핸들러 + Client Component
│   └── 브라우저 API → Client Component
└── NO → Server Component (기본)
    ├── DB 데이터 표시 → Server Component + createClient(server)
    └── 정적 콘텐츠 → Server Component
```

### 데이터 접근 결정

```
데이터가 필요한 곳?
├── Server Component → lib/supabase/server.ts → createClient()
├── Client Component → lib/supabase/client.ts → createClient()
├── API Route Handler → lib/supabase/server.ts → createClient()
└── Middleware → lib/supabase/proxy.ts → updateSession()
```

### 스타일 적용 결정

```
색상 지정 필요?
├── 시맨틱 색상 (배경, 텍스트, 보더 등) → Tailwind CSS 변수 클래스 사용
├── 커스텀 색상 필요 → globals.css에 CSS 변수 추가 (라이트+다크)
└── 하드코딩 색상 → **금지**
```

### 모호한 상황 처리

- 기존 코드 패턴이 있으면 **기존 패턴을 따르라**
- `docs/PRD.md`에 명세가 있으면 **PRD를 따르라**
- 둘 다 없으면 **사용자에게 확인하라**

---

## 금지 사항

| 번호 | 금지 항목 | 이유 |
|---|---|---|
| 1 | `components/ui/` 파일 직접 수정 | shadcn CLI가 관리, 업데이트 시 덮어씀 |
| 2 | Supabase 서버 클라이언트 전역 변수 저장 | Vercel Fluid Compute에서 요청 간 상태 공유 위험 |
| 3 | CSS 색상값 하드코딩 | 다크 모드 미지원, 테마 일관성 파괴 |
| 4 | `getUser()` 사용 | 매번 API 호출로 성능 저하, `getClaims()` 사용 |
| 5 | 미들웨어의 `supabaseResponse` 객체 변조 | 세션 쿠키 갱신 로직 파손 |
| 6 | `NEXT_PUBLIC_` 없이 클라이언트에 환경 변수 노출 | 보안 위반, 빌드 시 포함 안됨 |
| 7 | Server Component에서 React hooks 사용 | 런타임 에러 발생 |
| 8 | 인증 필요 페이지를 `app/` 루트에 직접 생성 | `protected/` 레이아웃의 인증 체크 및 네비게이션 누락 |
| 9 | RLS 정책 없이 Supabase 테이블 생성 | 데이터 무단 접근 위험 |
| 10 | Starter Kit 컴포넌트를 새 기능에 재사용 | 제거 예정 코드, 의존성 생성 금지 |
| 11 | 상대 경로 import (`../../`) | `@/*` 별칭 사용 필수 |
| 12 | `app/globals.css`에서 `:root`만 수정하고 `.dark` 미수정 | 다크 모드 스타일 깨짐 |

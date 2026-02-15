# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

라이프보드(Lifeboard) - 인생의 모든 데이터를 한눈에 볼 수 있는 통합 대시보드. Next.js + Supabase 기반. MVP는 한국 언론사 RSS 뉴스 수집 + AI 팩트 요약에 집중. Supabase Starter Kit에서 시작하여 개발 중.

## 개발 명령어

```bash
npm run dev      # 개발 서버 (localhost:3000)
npm run build    # 프로덕션 빌드 (Turbopack)
npm run lint     # ESLint 실행
```

## 기술 스택

- **Next.js 16** (App Router, Turbopack, Cache Components) + React 19 + TypeScript (strict)
- **Supabase** (@supabase/ssr) - 인증 및 백엔드
- **Tailwind CSS 3** + CSS 변수 기반 테마 (다크모드: `next-themes`, class 방식)
- **shadcn/ui** (new-york 스타일, Radix UI, lucide-react 아이콘)

## 아키텍처

### Supabase 클라이언트 패턴

`lib/supabase/`에 4개 모듈:

- `env.ts` - 환경 변수 검증 (`getSupabaseEnv()`). 모든 클라이언트 팩토리가 이를 통해 URL/Key를 가져옴
- `server.ts` - Server Component/Server Action용. **요청마다 새로 생성** (전역 변수 금지)
- `client.ts` - Client Component용 (브라우저)
- `proxy.ts` - Middleware(proxy)용. 세션 쿠키 갱신 및 미인증 사용자 리다이렉트 처리

인증 상태 확인 시 `supabase.auth.getClaims()` 사용 (`getUser()` 대비 빠름).

### Middleware (Next.js 16 Proxy 패턴)

Next.js 16에서는 `proxy.ts` (프로젝트 루트)가 미들웨어 역할을 함. **`middleware.ts`가 아님에 주의.** 빌드 시 `ƒ Proxy (Middleware)`로 표시됨. 이 파일은 `lib/supabase/proxy.ts`의 `updateSession()`을 호출하여 모든 요청에서 Supabase 세션을 갱신하고, 미인증 사용자를 `/auth/login`으로 리다이렉트. `/`, `/login`, `/auth/*`는 예외.

### 라우팅 구조

- `/` - 공개 홈 페이지 (별도 인라인 헤더, protected와 다른 레이아웃)
- `/auth/*` - 인증 플로우 (login, sign-up, forgot-password, update-password, confirm, error, sign-up-success)
- `/auth/confirm` - 이메일 OTP 검증 Route Handler (GET). Open Redirect 방지를 위해 `next` 파라미터는 상대 경로만 허용
- `/protected/*` - 인증 필요 페이지 (Header + Footer 공통 레이아웃, `max-w-6xl`)
- `/protected` - 대시보드
- `/protected/news` - 뉴스 페이지

### 컴포넌트 패턴

- `components/ui/` - shadcn/ui 기본 컴포넌트 (`npx shadcn@latest add <name>`으로 추가)
- `components/layout/` - 공통 레이아웃
  - `nav-links.ts` - 네비게이션 링크 상수 (header, mobile-nav에서 공유)
  - `header.tsx` - Server Component. AuthButton(서버), ThemeSwitcher(클라이언트), MobileNav(클라이언트) 조합
  - `mobile-nav.tsx` - Client Component. Sheet 기반, 768px 이하
  - `footer.tsx` - Client Component (`new Date()` 사용)
- `components/` 루트 - 인증 관련 컴포넌트
  - `auth-button.tsx` - **Server Component**. `getClaims()`로 인증 상태 확인. 반드시 `<Suspense>` 안에서 사용
  - `login-form.tsx`, `sign-up-form.tsx` 등 - Client Component

### Server/Client Component 경계 규칙

- `getClaims()`, `cookies()` 등 비캐시 데이터 접근하는 서버 컴포넌트는 반드시 `<Suspense>` 경계 내에 배치
- `new Date()` 등 동적 값을 사용하는 컴포넌트는 `"use client"` 또는 `<Suspense>` 경계 내에 배치
- Footer 컴포넌트는 `<Suspense>`로 감싸서 사용 (protected layout, 홈 페이지 모두)

## 코딩 규칙

- 경로 별칭: `@/*` (프로젝트 루트 기준)
- 들여쓰기: 2칸
- 주석/커밋/문서/UI 텍스트: 한국어
- 변수명/함수명: 영어
- CSS 색상: `globals.css`의 HSL CSS 변수 사용 (하드코딩 금지). 에러 텍스트는 `text-destructive` (`text-red-500` 사용 금지)
- 에러 메시지: 사용자에게 노출되는 메시지는 한국어로 작성

## 환경 변수

`.env.local`에 설정 (gitignore됨):

```
NEXT_PUBLIC_SUPABASE_URL=<supabase-project-url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<supabase-publishable-key>
SLACK_WEBHOOK_URL=<slack-webhook-url>  # 훅 알림용
```

## 개발 참고

- `docs/ROADMAP.md` - 개발 로드맵 (Phase 0~5, 체크박스로 진행 추적)
- `docs/PRD.md` - 제품 요구사항 문서

## MCP 서버

`.mcp.json`에 설정됨:
- `sequential-thinking` - 단계적 사고 지원
- `shadcn` - shadcn/ui 컴포넌트 관리
- `shrimp-task-manager` - 태스크 관리

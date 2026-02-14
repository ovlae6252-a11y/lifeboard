# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

라이프보드(Lifeboard) - Next.js + Supabase 기반 웹 애플리케이션. Supabase Starter Kit에서 시작하여 개발 중.

## 개발 명령어

```bash
npm run dev      # 개발 서버 (localhost:3000)
npm run build    # 프로덕션 빌드
npm run lint     # ESLint 실행
```

## 기술 스택

- **Next.js** (App Router) + React 19 + TypeScript (strict)
- **Supabase** (@supabase/ssr) - 인증 및 백엔드
- **Tailwind CSS 3** + CSS 변수 기반 테마 (다크모드: `next-themes`, class 방식)
- **shadcn/ui** (new-york 스타일, Radix UI, lucide-react 아이콘)

## 아키텍처

### Supabase 클라이언트 패턴

3가지 Supabase 클라이언트 팩토리가 `lib/supabase/`에 있으며, 용도에 따라 구분 사용:

- `server.ts` - Server Component/Server Action용. **요청마다 새로 생성** (전역 변수 금지)
- `client.ts` - Client Component용 (브라우저)
- `proxy.ts` - Middleware용. 세션 쿠키 갱신 처리

인증 상태 확인 시 `supabase.auth.getClaims()` 사용 (`getUser()` 대비 빠름).

### 라우팅 구조

- `/` - 공개 홈 페이지
- `/auth/*` - 인증 플로우 (login, sign-up, forgot-password, update-password, confirm, error, sign-up-success)
- `/auth/confirm` - 이메일 OTP 검증 Route Handler (GET)
- `/protected/*` - 인증 필요 페이지 (별도 layout)

### Middleware (`proxy.ts`)

모든 요청에서 Supabase 세션을 갱신하고, 미인증 사용자를 `/auth/login`으로 리다이렉트. `/`, `/login`, `/auth/*`는 예외.

### 컴포넌트 구조

- `components/ui/` - shadcn/ui 기본 컴포넌트 (`npx shadcn@latest add <name>`으로 추가)
- `components/layout/` - 공통 레이아웃 (header, mobile-nav, footer)
- `components/` 루트 - 인증 관련 컴포넌트 (auth-button, login-form, sign-up-form 등)

### Next.js 16 주의사항

- `new Date()` 등 동적 값을 사용하는 컴포넌트는 Client Component로 만들거나 `<Suspense>` 경계 내에 배치해야 함
- 비캐시 데이터 접근 (cookies, headers 등)은 반드시 `<Suspense>` 경계 안에서 수행

## 코딩 규칙

- 경로 별칭: `@/*` (프로젝트 루트 기준)
- 들여쓰기: 2칸
- 주석/커밋/문서: 한국어
- 변수명/함수명: 영어
- CSS 색상: `globals.css`의 HSL CSS 변수 사용 (하드코딩 금지)

## 환경 변수

`.env.local`에 설정 (gitignore됨):

```
NEXT_PUBLIC_SUPABASE_URL=<supabase-project-url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<supabase-publishable-key>
SLACK_WEBHOOK_URL=<slack-webhook-url>  # 훅 알림용
```

## MCP 서버

`.mcp.json`에 설정됨:
- `sequential-thinking` - 단계적 사고 지원
- `shadcn` - shadcn/ui 컴포넌트 관리
- `shrimp-task-manager` - 태스크 관리

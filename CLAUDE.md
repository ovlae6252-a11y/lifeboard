# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

라이프보드(Lifeboard) - 인생의 모든 데이터를 한눈에 볼 수 있는 통합 대시보드. Next.js + Supabase 기반. MVP는 한국 언론사 RSS 뉴스 수집 + AI 팩트 요약에 집중. Supabase Starter Kit에서 시작하여 개발 중.

## 개발 명령어

```bash
npm run dev          # 개발 서버 (localhost:3000)
npm run build        # 프로덕션 빌드 (Turbopack)
npm run lint         # ESLint 실행
npm run lint:fix     # ESLint 자동 수정
npm run format       # Prettier 전체 포매팅
npm run format:check # Prettier 포매팅 상태 확인
npm run type-check   # TypeScript 타입 검사
npx supabase db push # DB 마이그레이션 적용 (원격 Supabase)
```

### 코드 품질 도구

- **Prettier** - 코드 포매터 (`prettier-plugin-tailwindcss`로 Tailwind 클래스 자동 정렬)
- **ESLint** + `eslint-config-prettier` - 린터 (Prettier와 충돌 없음)
- **Husky** + **lint-staged** - 커밋 시 스테이징된 파일에 자동 린트/포매팅 (`pre-commit` hook)

## 기술 스택

- **Next.js 16** (App Router, Turbopack, `cacheComponents: true`) + React 19 + TypeScript (strict)
- **Supabase** (@supabase/ssr) - 인증 및 백엔드
- **Tailwind CSS 4** + CSS 변수 기반 테마 (다크모드: `next-themes`, class 방식, `@custom-variant dark`)
- **shadcn/ui** (new-york 스타일, Radix UI, lucide-react 아이콘)

## 아키텍처

### Supabase 클라이언트 패턴

`lib/supabase/`에 5개 모듈:

- `env.ts` - 환경 변수 검증 (`getSupabaseEnv()`). 모든 클라이언트 팩토리가 이를 통해 URL/Key를 가져옴
- `server.ts` - Server Component/Server Action용. **요청마다 새로 생성** (전역 변수 금지)
- `client.ts` - Client Component용 (브라우저)
- `proxy.ts` - Middleware(proxy)용. 세션 쿠키 갱신 및 미인증 사용자 리다이렉트 처리
- `admin.ts` - service_role 클라이언트 (RLS 우회). **모듈 레벨 싱글톤 캐싱** (쿠키 의존성 없으므로 재사용 가능). API Route, Cron 작업 등 서버 전용
- `database.types.ts` - Supabase CLI 생성 타입. 모든 클라이언트 팩토리에서 `<Database>` 제네릭으로 사용

인증 상태 확인 시 `supabase.auth.getClaims()` 사용 (`getUser()` 대비 빠름).

### Middleware (Next.js 16 Proxy 패턴)

Next.js 16에서는 `proxy.ts` (프로젝트 루트)가 미들웨어 역할을 함. **`middleware.ts`가 아님에 주의.** 빌드 시 `ƒ Proxy (Middleware)`로 표시됨. 이 파일은 `lib/supabase/proxy.ts`의 `updateSession()`을 호출하여 모든 요청에서 Supabase 세션을 갱신하고, 미인증 사용자를 `/auth/login`으로 리다이렉트. `/`, `/login`, `/auth/*`, `/api/*`는 예외.

### 라우팅 구조

- `/` - 공개 홈 페이지 (별도 인라인 헤더, protected와 다른 레이아웃)
- `/auth/*` - 인증 플로우 (login, sign-up, forgot-password, update-password, confirm, error, sign-up-success)
- `/auth/confirm` - 이메일 OTP 검증 Route Handler (GET). Open Redirect 방지를 위해 `next` 파라미터는 상대 경로만 허용
- `/protected/*` - 인증 필요 페이지 (Header + Footer 공통 레이아웃, `max-w-6xl`)
- `/protected` - 대시보드
- `/protected/news` - 뉴스 페이지
- `/api/news/collect` - RSS 수집 API (GET/POST, `CRON_SECRET` 인증 필요)

### 컴포넌트 패턴

- `components/ui/` - shadcn/ui 기본 컴포넌트 (`npx shadcn@latest add <name>`으로 추가)
- `components/layout/` - 공통 레이아웃 (header, mobile-nav, footer, nav-links 상수)
  - `header.tsx`는 Server Component. AuthButton(서버) + ThemeSwitcher/MobileNav(클라이언트) 조합
  - `footer.tsx`는 Client Component (`new Date()` 사용)
- `components/news/` - 뉴스 UI 컴포넌트 (Server/Client 분리)
- `components/` 루트 - 인증 관련 컴포넌트 (`auth-button.tsx`는 Server Component, 반드시 `<Suspense>` 안에서 사용)

### Server/Client Component 경계 규칙

- `getClaims()`, `cookies()` 등 비캐시 데이터 접근하는 서버 컴포넌트는 반드시 `<Suspense>` 경계 내에 배치
- `new Date()` 등 동적 값을 사용하는 컴포넌트는 `"use client"` 또는 `<Suspense>` 경계 내에 배치
- Footer 컴포넌트는 `<Suspense>`로 감싸서 사용 (protected layout, 홈 페이지 모두)
- `searchParams` Promise는 반드시 `<Suspense>` 경계 내의 async 컴포넌트에서 await (페이지 최상위에서 await 금지)

### Next.js 16 주의사항

- `cacheComponents: true` 설정으로 인해 `export const runtime` 등 route segment config가 충돌할 수 있음. API Route에서는 `export const maxDuration`만 사용
- `proxy.ts`(루트)가 middleware 역할이므로 `middleware.ts` 파일을 생성하면 안 됨

### 뉴스 수집 파이프라인

`lib/news/`에 수집 + 프론트엔드 쿼리 모듈이 함께 위치:

- 수집 흐름: Vercel Cron (하루 2회, KST 8시/20시 = UTC 23시/11시) → `/api/news/collect` → RSS 파싱 → 중복 필터링 → DB INSERT → 그룹핑 → 요약 큐
- 프론트엔드 쿼리: `queries.ts`의 `getNewsGroups()`, `getLatestNewsGroups()`, `getNewsGroupArticles()`
- Supabase embedded join 사용 시 FK 이름 명시 필요 (예: `news_articles!fk_representative_article`)
- Vercel Cron은 `CRON_SECRET` 환경변수가 설정되면 자동으로 `Authorization: Bearer <CRON_SECRET>` 헤더를 포함하여 호출

### Ollama PC 워커 (scripts/)

`scripts/` 디렉토리는 메인 Next.js 프로젝트와 **독립된 패키지**. `tsconfig.json`의 `exclude`에 포함되어 빌드 충돌 방지. Ollama가 설치된 PC에서 상주 실행.

- `worker.ts` - 메인 워커 (Supabase Realtime 구독 + 30초 폴링, `isProcessing` 플래그로 동시성 제어)
- `summarizer.ts` - Ollama 팩트 추출 모듈 (120초 타임아웃, 3회 재시도)
- 작업 흐름: pending 감지 → 낙관적 잠금(WHERE status=pending) → 기사 조회 → Ollama 요약 → fact_summary 저장 → completed

### DB 마이그레이션

`supabase/migrations/`에 SQL 마이그레이션 파일 관리. `npx supabase db push`로 적용.

테이블: `news_sources`, `news_article_groups`, `news_articles`, `news_fetch_logs`, `summarize_jobs`

RPC 함수 (service_role 전용, anon/authenticated 호출 불가):
- `find_similar_group` - 트라이그램 유사도 기반 그룹 검색
- `increment_article_count` - 그룹 기사 수 갱신

`summarize_jobs` 테이블에는 `(group_id) WHERE status IN ('pending', 'processing')` partial unique index가 있어 동일 그룹에 대한 중복 작업 생성을 방지함.

## 코딩 규칙

- 경로 별칭: `@/*` (프로젝트 루트 기준)
- 들여쓰기: 2칸
- 주석/커밋/문서/UI 텍스트: 한국어
- 변수명/함수명: 영어
- CSS 색상: `globals.css`의 OKLCH CSS 변수 사용 (하드코딩 금지). 에러 텍스트는 `text-destructive` (`text-red-500` 사용 금지)
- Tailwind CSS 설정: `tailwind.config.ts` 없음. 모든 테마 설정은 `globals.css`의 `@theme inline` 블록에서 관리. `@import "tailwindcss"` + `@import "tw-animate-css"` 사용
- 에러 메시지: 사용자에게 노출되는 메시지는 한국어로 작성
- API Route 에러 응답: 프로덕션에서는 상세 에러 대신 일반적인 메시지 반환 (`process.env.NODE_ENV` 분기)
- Supabase DB 작업 후 반드시 에러 확인 및 로깅 (`const { error } = await ...` 패턴)
- Supabase `.in()` 쿼리는 50개 단위로 배치 분할 (PostgREST URL 길이 제한 방지)
- Supabase 중복 INSERT 방지 시 check-then-insert 대신 INSERT-first + unique constraint violation(23505) 핸들링

## 환경 변수

`.env.local`에 설정 (gitignore됨). `.env.example` 참고:

```
NEXT_PUBLIC_SUPABASE_URL=<supabase-project-url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<supabase-publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>  # 서버 전용, 절대 클라이언트 노출 금지
CRON_SECRET=<랜덤-시크릿>                     # API Route 인증용 (Vercel Cron 자동 포함)
SLACK_WEBHOOK_URL=<slack-webhook-url>          # 훅 알림용 (선택)
```

## 개발 참고

- `docs/ROADMAP.md` - 개발 로드맵 (Phase 0~5, 체크박스로 진행 추적)
- `docs/PRD.md` - 제품 요구사항 문서

## 태스크 관리 규칙

- "plan task", "태스크 계획", "작업 분석" 등 태스크 관련 요청 시 반드시 **shrimp-task-manager MCP 도구**를 사용할 것
- **내장 EnterPlanMode를 사용하지 말 것** — 대신 ToolSearch로 shrimp-task-manager 도구를 로드하여 사용
- shrimp-task-manager 주요 도구: `plan_task`, `analyze_task`, `split_tasks`, `execute_task`, `verify_task`

## MCP 서버

`.mcp.json`에 설정됨:
- `sequential-thinking` - 단계적 사고 지원
- `shadcn` - shadcn/ui 컴포넌트 관리
- `shrimp-task-manager` - 태스크 관리

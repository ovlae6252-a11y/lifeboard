# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

라이프보드(Lifeboard) - 인생의 모든 데이터를 한눈에 볼 수 있는 통합 대시보드. Next.js + Supabase 기반. MVP는 한국 언론사 RSS 뉴스 수집 + AI 팩트 요약에 집중. Supabase Starter Kit에서 시작하여 개발 중.

## 개발 명령어

```bash
npm run dev          # 개발 서버 (localhost:3000)
npm run build        # 프로덕션 빌드 (Turbopack)
npm run lint         # ESLint 실행
npx supabase db push # DB 마이그레이션 적용 (원격 Supabase)
```

## 기술 스택

- **Next.js 16** (App Router, Turbopack, `cacheComponents: true`) + React 19 + TypeScript (strict)
- **Supabase** (@supabase/ssr) - 인증 및 백엔드
- **Tailwind CSS 3** + CSS 변수 기반 테마 (다크모드: `next-themes`, class 방식)
- **shadcn/ui** (new-york 스타일, Radix UI, lucide-react 아이콘)

## 아키텍처

### Supabase 클라이언트 패턴

`lib/supabase/`에 5개 모듈:

- `env.ts` - 환경 변수 검증 (`getSupabaseEnv()`). 모든 클라이언트 팩토리가 이를 통해 URL/Key를 가져옴
- `server.ts` - Server Component/Server Action용. **요청마다 새로 생성** (전역 변수 금지)
- `client.ts` - Client Component용 (브라우저)
- `proxy.ts` - Middleware(proxy)용. 세션 쿠키 갱신 및 미인증 사용자 리다이렉트 처리
- `admin.ts` - service_role 클라이언트 (RLS 우회). API Route, Cron 작업 등 서버 전용

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
- `components/layout/` - 공통 레이아웃
  - `nav-links.ts` - 네비게이션 링크 상수 (header, mobile-nav에서 공유)
  - `header.tsx` - Server Component. AuthButton(서버), ThemeSwitcher(클라이언트), MobileNav(클라이언트) 조합
  - `mobile-nav.tsx` - Client Component. Sheet 기반, 768px 이하
  - `footer.tsx` - Client Component (`new Date()` 사용)
- `components/news/` - 뉴스 UI 컴포넌트
  - `news-group-card.tsx` - Server Component. Card 기반 뉴스 그룹 카드 (팩트 요약 불릿, 원문 링크)
  - `news-category-tabs.tsx` - Client Component. shadcn/ui Tabs 기반, URL 쿼리 파라미터 동기화
  - `news-list.tsx` - Server Component. 반응형 그리드 (1열/2열) + 빈 상태 처리
  - `news-skeleton.tsx` - 스켈레톤 로딩 (Suspense fallback)
  - `news-dashboard-section.tsx` - async Server Component. 대시보드 최신 6개 뉴스
- `components/` 루트 - 인증 관련 컴포넌트
  - `auth-button.tsx` - **Server Component**. `getClaims()`로 인증 상태 확인. 반드시 `<Suspense>` 안에서 사용
  - `login-form.tsx`, `sign-up-form.tsx` 등 - Client Component

### Server/Client Component 경계 규칙

- `getClaims()`, `cookies()` 등 비캐시 데이터 접근하는 서버 컴포넌트는 반드시 `<Suspense>` 경계 내에 배치
- `new Date()` 등 동적 값을 사용하는 컴포넌트는 `"use client"` 또는 `<Suspense>` 경계 내에 배치
- Footer 컴포넌트는 `<Suspense>`로 감싸서 사용 (protected layout, 홈 페이지 모두)
- `searchParams` Promise는 반드시 `<Suspense>` 경계 내의 async 컴포넌트에서 await (페이지 최상위에서 await 금지)

### Next.js 16 주의사항

- `cacheComponents: true` 설정으로 인해 `export const runtime` 등 route segment config가 충돌할 수 있음. API Route에서는 `export const maxDuration`만 사용
- `proxy.ts`(루트)가 middleware 역할이므로 `middleware.ts` 파일을 생성하면 안 됨

### 뉴스 수집 파이프라인

`lib/news/`에 수집 관련 모듈:
- `types.ts` - 뉴스 관련 타입 정의
- `normalize-title.ts` - 제목 정규화 (태그 제거, 특수문자 제거, 소문자 변환)
- `rss-fetcher.ts` - RSS 피드 파싱 (`rss-parser`, 5초 타임아웃, 이미지 URL은 http/https만 허용)
- `grouping.ts` - 유사 기사 그룹핑 (`find_similar_group` RPC, 유사도 0.6, 48시간 범위)
- `fetch-logger.ts` - 수집 로그 기록
- `summarize-queue.ts` - AI 요약 작업 큐 관리
- `categories.ts` - 뉴스 카테고리 상수 및 getCategoryLabel 헬퍼
- `queries.ts` - 프론트엔드용 데이터 페칭 함수 (getNewsGroups, getLatestNewsGroups, getNewsGroupArticles)

### 유틸리티 함수

`lib/utils/`에 공통 유틸리티:
- `format-time.ts` - 상대 시간 표시 (formatRelativeTime: "방금 전", "N분 전", "어제" 등)
- `parse-facts.ts` - AI 팩트 요약 텍스트를 배열로 파싱 (parseFacts)

수집 흐름: Vercel Cron (매시 정각) → `/api/news/collect` → RSS 파싱 → 중복 필터링 → DB INSERT → 그룹핑 → 요약 큐

Vercel Cron은 `CRON_SECRET` 환경변수가 설정되면 자동으로 `Authorization: Bearer <CRON_SECRET>` 헤더를 포함하여 호출함.

### Ollama PC 워커 (scripts/)

`scripts/` 디렉토리는 메인 Next.js 프로젝트와 **독립된 패키지**. Ollama가 설치된 PC에서 상주 실행.

- `worker.ts` - 메인 워커 (Supabase Realtime 구독 + 30초 폴링으로 summarize_jobs 큐 감시)
- `summarizer.ts` - Ollama 팩트 추출 모듈 (PRD 프롬프트, 120초 타임아웃, 3회 재시도)
- `package.json` - 독립 패키지 (dependencies: @supabase/supabase-js, ollama, dotenv, tsx)
- `.env.example` - Ollama PC용 환경변수 (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OLLAMA_BASE_URL, OLLAMA_MODEL)

작업 흐름: pending 감지 → 낙관적 잠금(WHERE status=pending) → 기사 조회 → Ollama 요약 → fact_summary 저장 → completed

### DB 마이그레이션

`supabase/migrations/`에 SQL 마이그레이션 파일 관리. `npx supabase db push`로 적용.

테이블: `news_sources`, `news_article_groups`, `news_articles`, `news_fetch_logs`, `summarize_jobs`

RPC 함수 (service_role 전용, anon/authenticated 호출 불가):
- `find_similar_group` - 트라이그램 유사도 기반 그룹 검색
- `increment_article_count` - 그룹 기사 수 갱신

## 코딩 규칙

- 경로 별칭: `@/*` (프로젝트 루트 기준)
- 들여쓰기: 2칸
- 주석/커밋/문서/UI 텍스트: 한국어
- 변수명/함수명: 영어
- CSS 색상: `globals.css`의 HSL CSS 변수 사용 (하드코딩 금지). 에러 텍스트는 `text-destructive` (`text-red-500` 사용 금지)
- 에러 메시지: 사용자에게 노출되는 메시지는 한국어로 작성
- API Route 에러 응답: 프로덕션에서는 상세 에러 대신 일반적인 메시지 반환 (`process.env.NODE_ENV` 분기)

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

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

라이프보드(Lifeboard) - 인생의 모든 데이터를 한눈에 볼 수 있는 통합 대시보드. Next.js + Supabase 기반.

- **현재 버전**: v1.1d (날씨 위젯 + 대시보드 위젯 시스템 + 관리자 확장 완료)
- **MVP 상태**: Phase 0~5 완료 (2026-02-16), v1.1a 완료 (2026-02-16), v1.1b 완료 (2026-02-16), v1.1c 완료 (2026-02-18), v1.1d 완료 (2026-02-18)
- **프로덕션**: https://lifeboard-omega.vercel.app
- **GitHub**: https://github.com/ovlae6252-a11y/lifeboard

**주요 기능** (v1.1d 기준):
- 소셜 로그인 (Google, Kakao OAuth 통합)
- RSS 뉴스 자동 수집 (20+ 언론사, 하루 2회)
- 유사 기사 그룹핑 (pg_trgm 기반, 유사도 임계값 0.5)
- AI 팩트 요약 (Ollama qwen2.5:14b, 한국어 품질 검증)
- 콘텐츠 필터링 (키워드 블랙리스트/화이트리스트)
- 뉴스 검색 (pg_trgm 유사도 기반, 제목 및 요약 검색)
- 뉴스 북마크 (최대 100개, 낙관적 UI 업데이트)
- 뉴스 공유 (팩트 요약/링크 복사, Toast 알림)
- 사용자 설정 (프로필 확인, 선호 카테고리 관리)
- 뉴스 상세 페이지 (팩트 요약 + 관련 기사 목록)
- 카테고리별 탐색 및 페이지네이션
- 반응형 대시보드 + 다크모드
- **날씨 위젯** (v1.1d): OpenWeatherMap 연동, 현재 날씨 + 시간별/주간 예보, 대시보드 위젯 (`WEATHER_API_KEY` 필요)
- **대시보드 위젯 설정** (v1.1d): 뉴스/날씨 위젯 표시 토글 (`dashboard_config` JSONB)
- **관리자 시스템** (v1.1c/v1.1d): 역할 기반 접근 제어, 통계 대시보드, 뉴스 관리, 콘텐츠 모더레이션, 사용자 관리, 시스템 모니터링, 감사 로그

## 개발 명령어

```bash
npm run dev             # 개발 서버 (localhost:3000)
npm run build           # 프로덕션 빌드 (Turbopack)
npm run lint            # ESLint 실행
npm run lint:fix        # ESLint 자동 수정
npm run format          # Prettier 전체 포매팅
npm run format:check    # Prettier 포매팅 상태 확인
npm run type-check      # TypeScript 타입 검사
npx playwright test                              # E2E 테스트 전체 실행
npx playwright test tests/news-search.spec.ts    # 특정 테스트 파일 실행
npx playwright test --ui                         # 테스트 UI 모드
npx supabase db push    # DB 마이그레이션 적용 (원격 Supabase)
```

### 코드 품질 도구

- **Prettier** - 코드 포매터 (`printWidth: 80`, `singleQuote: false`, `trailingComma: "all"`, `prettier-plugin-tailwindcss`)
- **ESLint** + `eslint-config-prettier` - 린터 (Prettier와 충돌 없음)
- **Husky** + **lint-staged** - 커밋 시 `pre-commit` hook 실행. `.ts/.tsx`는 ESLint + Prettier, `.css/.json/.md`는 Prettier만 적용
- **Playwright** - E2E 테스트 (auth setup 패턴, `playwright/.auth/user.json`에 인증 상태 저장)

## 기술 스택

- **Next.js 16** (App Router, Turbopack, `cacheComponents: true`) + React 19 + TypeScript (strict)
- **Supabase** (@supabase/ssr) - 인증 및 백엔드
- **Tailwind CSS 4** + CSS 변수 기반 테마 (다크모드: `next-themes`, class 방식, `@custom-variant dark`)
- **shadcn/ui** (new-york 스타일, Radix UI, lucide-react 아이콘)
- **폰트**: Libre Baskerville(sans 기본) + Noto Sans KR(한글) + Lora(serif) + IBM Plex Mono(mono) — `next/font/google`, CSS 변수 방식

## 아키텍처

### Supabase 클라이언트 패턴

`lib/supabase/`에 5개 모듈:

- `env.ts` - 환경 변수 검증 (`getSupabaseEnv()`). 모든 클라이언트 팩토리가 이를 통해 URL/Key를 가져옴
- `server.ts` - Server Component/Server Action용. **요청마다 새로 생성** (전역 변수 금지)
- `client.ts` - Client Component용 (브라우저)
- `proxy.ts` - Middleware(proxy)용. 세션 쿠키 갱신 및 미인증 사용자 리다이렉트 처리
- `admin.ts` - service_role 클라이언트 (RLS 우회). **모듈 레벨 싱글톤 캐싱** (쿠키 의존성 없으므로 재사용 가능). API Route, Cron 작업, `use cache` 함수 등 서버 전용 (쿠키 의존성 없는 환경)
- `database.types.ts` - Supabase CLI 생성 타입. 모든 클라이언트 팩토리에서 `<Database>` 제네릭으로 사용

인증 상태 확인 시 `supabase.auth.getClaims()` 사용 (`getUser()` 대비 빠름).

### Middleware (Next.js 16 Proxy 패턴)

Next.js 16에서는 `proxy.ts` (프로젝트 루트)가 미들웨어 역할을 함. **`middleware.ts`가 아님에 주의.** 빌드 시 `ƒ Proxy (Middleware)`로 표시됨. 내보내는 함수명은 `proxy` (not `middleware`). 이 파일은 `lib/supabase/proxy.ts`의 `updateSession()`을 호출하여 모든 요청에서 Supabase 세션을 갱신하고, 미인증 사용자를 `/auth/login`으로 리다이렉트. `/`, `/login`, `/auth/*`, `/api/*`는 예외. `config.matcher`로 정적 파일(`_next/static`, `_next/image`, `favicon.ico`, 이미지 파일)은 제외.

### 라우팅 구조

- `/` - 공개 홈 페이지 (별도 인라인 헤더, protected와 다른 레이아웃)
- `/auth/*` - 인증 플로우 (login, error)
- `/auth/login` - 소셜 로그인 페이지 (Google, Kakao, v1.1b)
- `/auth/callback` - OAuth 콜백 Route Handler (GET, code 교환 → 세션 생성, v1.1b)
- `/protected/*` - 인증 필요 페이지 (Header + Footer 공통 레이아웃, `max-w-6xl`)
- `/protected` - 대시보드 (최신 뉴스 6개 프리뷰)
- `/protected/news` - 뉴스 목록 페이지 (카테고리 탭 + 검색바 + 페이지네이션, v1.1b 검색 추가)
- `/protected/news/[groupId]` - 뉴스 상세 페이지 (팩트 요약 + 관련 기사 + 북마크/공유 버튼, v1.1a/v1.1b)
- `/protected/settings` - 사용자 설정 페이지 (프로필, 선호 카테고리, 대시보드 위젯 설정, v1.1b/v1.1d)
- `/protected/weather` - 날씨 상세 페이지 (현재 날씨 + 시간별/주간 예보, v1.1d)
- `/api/auth/dev-login` - 개발용 로그인 API (POST, 테스트 사용자 자동 생성, v1.1b)
- `/api/news/collect` - RSS 수집 API (GET/POST, `CRON_SECRET` 인증 필요)
- `/api/news/bookmarks` - 북마크 API (GET/POST/DELETE, 최대 100개 제한, v1.1b)
- `/api/user/preferences` - 사용자 설정 API (GET/PUT, preferred_categories 관리, v1.1b)
- `/admin/*` - 관리자 전용 페이지 (`AdminSidebar` + `main` 레이아웃, `isAdmin()` 실패 시 `/protected` 리다이렉트, v1.1c)
- `/admin` - 관리자 대시보드 (시스템 통계, 파이프라인 상태, 차트, 최근 활동 로그)
- `/admin/news` - 뉴스 관리 (소스/그룹/기사 탭, URL `?tab=` 파라미터 동기화)
- `/api/admin/news/sources` - 뉴스 소스 관리 API (GET/POST/PUT/DELETE, RSS 유효성 검증)
- `/api/admin/news/groups` - 뉴스 그룹 관리 API (GET/PUT, 숨김 토글 + 요약 재실행)
- `/api/admin/news/articles` - 뉴스 기사 관리 API (GET 검색, DELETE soft-delete, PUT 그룹 변경)
- `/admin/moderation` - 콘텐츠 모더레이션 (필터 관리/품질 검토 탭, v1.1d)
- `/admin/users` - 사용자 관리 (역할 변경, 계정 정지, v1.1d)
- `/admin/monitoring` - 시스템 모니터링 (수집 로그/요약 작업/시스템 상태 탭, v1.1d)
- `/api/admin/moderation/filters` - 콘텐츠 필터 CRUD API (GET/POST/PUT/DELETE, v1.1d)
- `/api/admin/moderation/quality` - 품질 검토 API (GET/PUT approve, POST rerun, v1.1d)
- `/api/admin/users` - 사용자 목록 조회 API (GET, 페이지네이션 + 이메일 검색, v1.1d)
- `/api/admin/users/[userId]` - 사용자 수정 API (PUT, 역할 변경/계정 정지, v1.1d)
- `/api/admin/monitoring/logs` - 수집 로그 API (GET, 소스/상태/날짜 필터, v1.1d)
- `/api/admin/monitoring/jobs` - 요약 작업 API (GET/PUT retry/reset, v1.1d)
- `/api/admin/monitoring/status` - 시스템 상태 API (GET, lastCronRun/워커활동/DB통계, v1.1d)

### 컴포넌트 패턴

- `components/ui/` - shadcn/ui 기본 컴포넌트 (`npx shadcn@latest add <name>`으로 추가)
  - `sonner.tsx` - Toast 알림 (sonner 라이브러리, 테마 통합, v1.1b)
- `components/layout/` - 공통 레이아웃 (header, mobile-nav, footer, nav-links 상수)
  - `header.tsx`는 Server Component. AuthButton(서버) + ThemeSwitcher/MobileNav(클라이언트) 조합
  - `footer.tsx`는 Client Component (`new Date()` 사용)
  - `nav-links.ts` - Navigation 링크 상수 (대시보드, 뉴스, 설정, v1.1b 설정 추가)
- `components/news/` - 뉴스 UI 컴포넌트. Server: `news-group-card.tsx`, `news-dashboard-section.tsx`, `news-empty-state.tsx`. Client: `relative-time.tsx`(상대 시간 자동 갱신), `bookmark-button.tsx`(useOptimistic), `news-search-bar.tsx`(URL 쿼리 관리), `news-pagination.tsx`, `share-button.tsx`. 마크다운: `markdown-fact.tsx`(react-markdown + remark-gfm)
- `components/settings/` - 사용자 설정 (프로필, 선호 카테고리, `widget-settings.tsx` 대시보드 위젯 토글)
- `components/weather/` - 날씨 UI 컴포넌트 (v1.1d). `weather-widget.tsx`(Server Component, 대시보드용), `hourly-forecast.tsx`, `weekly-forecast.tsx`
- `lib/weather/` - 날씨 모듈 (v1.1d). `api.ts`(OpenWeatherMap API, "use cache" 30분), `locations.ts`(한국 17개 시/도 좌표), `icons.ts`(아이콘 매핑)
- `components/admin/` - 관리자 UI 컴포넌트 (모두 Client Component). `admin-sidebar.tsx`(현재 경로 활성, 5개 섹션), `stats-cards.tsx`, `pipeline-status.tsx`, `quality-metrics.tsx`, `collection-chart.tsx`/`category-chart.tsx`(Recharts), `recent-activity.tsx`, `news-source-manager.tsx`, `news-group-manager.tsx`, `news-article-manager.tsx`, `filter-manager.tsx`(v1.1d), `quality-review-queue.tsx`(v1.1d), `moderation-tabs.tsx`(v1.1d), `user-list.tsx`(v1.1d), `fetch-log-viewer.tsx`(v1.1d), `job-manager.tsx`(v1.1d), `system-status.tsx`(v1.1d), `monitoring-tabs.tsx`(v1.1d)
- `auth-button.tsx` - Server Component, 반드시 `<Suspense>` 안에서 사용

### 관리자 시스템 (v1.1c)

`lib/auth/admin.ts` - 관리자 인증 유틸리티:
- `requireAdmin()` - `getClaims()`의 `app_metadata.role === 'admin'` 확인. 실패 시 `"관리자 권한이 필요합니다"` 에러 throw. 모든 `/api/admin/*` Route 최상단에서 호출 필수.
- `logAdminAction({ adminId, action, targetType, targetId, details })` - `admin_audit_logs` 테이블에 행위 기록. 민감한 작업(숨김, 삭제, 요약 재실행)마다 호출.

`lib/admin/queries.ts` - 관리자 데이터 조회 (모두 `createAdminClient()` 사용):
- `getSystemStats()`, `getDailyCollectionStats(days)`, `getCategoryDistribution()`, `getRecentActivity()`
- `getFetchLogs({ sourceId?, dateFrom?, dateTo?, status?, page, limit })` - 수집 로그 페이지네이션 조회 (v1.1d)
- `getSummarizeJobs({ status?, page, limit })` - 요약 작업 페이지네이션 조회, 그룹 제목 포함 (v1.1d)
- `getSystemStatus()` - 마지막 Cron 실행/워커 활동/테이블 레코드 수 (v1.1d)

**프록시 관리자 보호**: `proxy.ts`(루트)에서 `/admin/*` 접근 시 세션 갱신 결과에서 `app_metadata.role`을 재사용. **`getClaims()` 이중 호출 금지** - 성능 저하 원인.

**초기 관리자 설정**: SQL Editor에서 수동 실행 (마이그레이션 파일 아님):
```sql
UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb WHERE email = '<admin-email>';
```

### Server/Client Component 경계 규칙

- `getClaims()`, `cookies()` 등 비캐시 데이터 접근하는 서버 컴포넌트는 반드시 `<Suspense>` 경계 내에 배치
- `new Date()` 등 동적 값을 사용하는 컴포넌트는 `"use client"` 또는 `<Suspense>` 경계 내에 배치
- Footer 컴포넌트는 `<Suspense>`로 감싸서 사용 (protected layout, 홈 페이지 모두)
- `searchParams` Promise는 반드시 `<Suspense>` 경계 내의 async 컴포넌트에서 await (페이지 최상위에서 await 금지)

### Next.js 16 주의사항

- `cacheComponents: true` 설정으로 인해 `export const runtime` 등 route segment config가 충돌할 수 있음. API Route에서는 `export const maxDuration`만 사용
- `proxy.ts`(루트)가 middleware 역할이므로 `middleware.ts` 파일을 생성하면 안 됨
- 언론사 이미지 도메인 추가 시 `next.config.ts`의 `images.remotePatterns` 배열에 항목 추가 필요
- Vercel Cron 스케줄은 `vercel.json`에서 관리 (UTC 기준, 현재 23:00/11:00 = KST 8시/20시)
- Supabase Auth Admin API (`auth.admin.listUsers()` 등)를 Server Component에서 직접 호출할 경우 `await connection()` (from `next/server`)으로 동적 렌더링 강제 필요 (프리렌더링 시 HANGING_PROMISE_REJECTION 방지)

### 뉴스 수집 파이프라인

`lib/news/`에 수집 + 프론트엔드 쿼리 모듈이 함께 위치:

- **수집 흐름** (v1.1a): Vercel Cron (하루 2회, KST 8시/20시 = UTC 23시/11시) → `/api/news/collect` → RSS 파싱 → **콘텐츠 필터링** → 중복 필터링 → DB INSERT → 그룹핑 (유사도 0.5, 72시간) → 요약 큐
- **프론트엔드 쿼리**: `queries.ts`의 `getNewsGroups()`, `getLatestNewsGroups()`, `getNewsGroupDetail()`, `getRelatedArticles()`
- **콘텐츠 필터링** (v1.1a): `content-filter.ts`의 `shouldFilterArticle()` 함수. `content_filters` 테이블에서 블랙리스트/화이트리스트 키워드 조회 후 필터링 판단
- Supabase embedded join 사용 시 FK 이름 명시 필요 (예: `news_articles!fk_representative_article`)
- Vercel Cron은 `CRON_SECRET` 환경변수가 설정되면 자동으로 `Authorization: Bearer <CRON_SECRET>` 헤더를 포함하여 호출

### Ollama PC 워커 (scripts/)

`scripts/` 디렉토리는 메인 Next.js 프로젝트와 **독립된 패키지**. `tsconfig.json`의 `exclude`에 포함되어 빌드 충돌 방지. Ollama가 설치된 PC에서 상주 실행.

- `worker.ts` - 메인 워커 (Supabase Realtime 구독 + 30초 폴링, `isProcessing` 플래그로 동시성 제어)
- `summarizer.ts` - Ollama 팩트 추출 모듈 (120초 타임아웃, 3회 재시도, **한국어 품질 검증** v1.1a)
- **작업 흐름** (v1.1a): pending 감지 → 낙관적 잠금(WHERE status=pending) → 기사 조회 → Ollama 요약 → **한국어 검증** (`validateKoreanContent()`, 한글 비율 70% 이상) → 검증 성공 시 fact_summary 저장 + `is_valid = true`, 실패 시 `is_valid = false` + 에러 기록 → completed
- **한국어 프롬프트 강화** (v1.1a): "**CRITICAL: 반드시 한국어로만 작성하세요...**" 지시문 추가
- 환경변수: `scripts/.env`에 별도 설정 (`OLLAMA_BASE_URL`, `OLLAMA_MODEL` 등 — `scripts/.env.example` 참고)

### DB 마이그레이션

`supabase/migrations/`에 SQL 마이그레이션 파일 관리. `npx supabase db push`로 적용.

**테이블:**
- `news_sources` - RSS 피드 소스 (언론사명, 피드 URL, 카테고리)
- `news_article_groups` - 유사 기사 그룹 (대표 기사, 팩트 요약, 카테고리, **`is_valid` 품질 플래그** v1.1a)
- `news_articles` - 개별 기사 (제목, URL, 소스, 그룹 연결, **`is_deleted` soft delete** v1.1a)
- `news_fetch_logs` - 수집 로그 (소스별 성공/실패, 수집 개수, **`filtered_count` 필터링된 개수** v1.1a)
- `summarize_jobs` - AI 요약 작업 큐 (상태: pending/processing/completed/failed)
- `content_filters` - 콘텐츠 필터링 규칙 (블랙리스트/화이트리스트 키워드, v1.1a)
- **`user_preferences`** - 사용자 설정 (선호 카테고리, 대시보드 설정, v1.1b)
- **`user_bookmarks`** - 사용자 북마크 (뉴스 그룹 ID, 최대 100개 제한, v1.1b)
- **`admin_audit_logs`** - 관리자 행위 감사 로그 (`admin_id`, `action`, `target_type`, `target_id`, `details JSONB`, v1.1c)

**RPC 함수** (service_role 전용, anon/authenticated 호출 불가):
- `find_similar_group` - 트라이그램 유사도 기반 그룹 검색
- `increment_article_count` - 그룹 기사 수 갱신
- `cleanup_old_records` - 오래된 로그/작업 자동 정리 (90일 로그, 30일 완료 작업)
- `enqueue_summarize_jobs` - 요약 작업 일괄 등록
- `get_top_articles_for_groups` - 그룹별 상위 N개 기사 조회 (윈도우 함수)
- `batch_group_articles` - 배치 그룹핑 (**유사도 임계값 0.5, 72시간 범위**, v1.1a 파라미터 조정)
- **`get_user_bookmarks`** - 북마크 목록 조회 (JOIN으로 뉴스 그룹 정보 포함, v1.1b)
- **`search_news_groups`** - 뉴스 검색 (pg_trgm 유사도 기반, 제목 및 요약 검색, v1.1b)

**제약조건:**
- `summarize_jobs` 테이블: `(group_id) WHERE status IN ('pending', 'processing')` partial unique index로 중복 작업 방지
- `news_article_groups`: `WHERE is_valid = true` partial index로 품질 검증된 그룹만 조회 최적화 (v1.1a)

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
- SQL 마이그레이션 파일의 키워드는 소문자로 통일 (`create or replace function`, `security definer` 등)

## 환경 변수

`.env.local`에 설정 (gitignore됨). `.env.example` 참고:

```env
# Supabase (필수)
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>  # 서버 전용, 절대 클라이언트 노출 금지

# API 인증 (필수)
CRON_SECRET=<랜덤-시크릿>                     # API Route 인증용 (Vercel Cron 자동 포함)

# 날씨 (선택)
WEATHER_API_KEY=<openweathermap-api-key>       # OpenWeatherMap Free tier, 미설정 시 날씨 위젯 숨김

# 알림 (선택)
SLACK_WEBHOOK_URL=<slack-webhook-url>          # 훅 알림용

# 테스트 (로컬)
TEST_USER_EMAIL=test@lifeboard.dev
TEST_USER_PASSWORD=TestPass1234!@
```

> **참고**: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`는 Supabase 대시보드의 "anon" public key입니다.
> [API 설정](https://supabase.com/dashboard/project/_?showConnect=true)에서 확인할 수 있습니다.

## 개발 참고

- `docs/ROADMAP.md` - 개발 로드맵 (v1.0~v1.1d 완료, v1.2 예정)
- `docs/PRD.md` - 제품 요구사항 문서 (v2.4, 2026-02-16)
- `docs/ISSUE.md` - 알려진 이슈 및 버그 추적
- `docs/complete/ROADMAP_v1.0.md` - v1.0 (Phase 0~5) 아카이브

## 태스크 관리 규칙

- "plan task", "태스크 계획", "작업 분석" 등 태스크 관련 요청 시 반드시 **shrimp-task-manager MCP 도구**를 사용할 것
- **내장 EnterPlanMode를 사용하지 말 것** — 대신 ToolSearch로 shrimp-task-manager 도구를 로드하여 사용
- shrimp-task-manager 주요 도구: `plan_task`, `analyze_task`, `split_tasks`, `execute_task`, `verify_task`

## MCP 서버

`.mcp.json`에 설정됨:
- `sequential-thinking` - 단계적 사고 지원
- `shadcn` - shadcn/ui 컴포넌트 관리
- `shrimp-task-manager` - 태스크 관리

글로벌 설정(`.claude/plugins/`)에서 제공:
- `supabase` - Supabase 프로젝트 관리 (SQL 실행, 마이그레이션 등)
- `playwright` - 브라우저 E2E 테스트
- `context7` - 라이브러리 문서 조회

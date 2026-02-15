# Lifeboard (라이프보드) - 개발 로드맵

## 개요

라이프보드는 인생의 모든 데이터를 한눈에 볼 수 있는 통합 대시보드 웹 애플리케이션이다. MVP 단계에서는 한국 주요 언론사 RSS 뉴스 수집, AI 기반 팩트 요약, 카테고리별 뉴스 탐색 기능에 집중한다.

이 로드맵은 `docs/PRD.md`(v1.0, 2026-02-14)를 기반으로 작성되었으며, 현재 Supabase Starter Kit 기반으로 초기화된 프로젝트 상태에서 출발한다. 기본 인증 구조(로그인/회원가입 폼, 미들웨어, protected 레이아웃)가 이미 존재하므로 이를 활용하여 개발을 진행한다.

## 기술 스택

| 영역                  | 기술                     | 버전/비고               |
| --------------------- | ------------------------ | ----------------------- |
| 프론트엔드 프레임워크 | Next.js (App Router)     | 16                      |
| UI 라이브러리         | React                    | 19                      |
| 언어                  | TypeScript               | 5.6+ (strict)           |
| 스타일링              | TailwindCSS              | 3 (CSS 변수 기반 테마)  |
| UI 컴포넌트           | shadcn/ui                | new-york 스타일         |
| 아이콘                | Lucide React             | -                       |
| 다크모드              | next-themes              | class 방식              |
| BaaS                  | Supabase (@supabase/ssr) | 인증, DB, RLS, Realtime |
| 데이터베이스          | PostgreSQL               | Supabase 포함           |
| AI                    | Ollama (qwen2.5:14b)     | 로컬 LLM, 별도 PC       |
| RSS 파싱              | rss-parser               | npm 패키지              |
| 배포                  | Vercel                   | Cron 작업 지원          |
| 패키지 관리           | npm                      | -                       |

## 아키텍처 개요

시스템은 크게 세 부분으로 구성된다:

1. **Vercel 웹앱 + Cron**: Next.js App Router 기반 웹 애플리케이션. Vercel Cron이 1시간마다 RSS 수집 API를 호출한다.
2. **Supabase PostgreSQL (클라우드)**: 데이터 저장소이자 메시지 큐 역할. `summarize_jobs` 테이블이 Vercel과 Ollama PC 사이의 작업 큐로 동작한다.
3. **Ollama PC (상주 워커)**: 같은 LAN 내 별도 PC에서 `qwen2.5:14b` 모델을 구동. Supabase Realtime/폴링으로 pending 작업을 감지하여 팩트 요약을 자동 처리한다.

```
[Vercel Cron 1시간] -> [/api/news/collect] -> [Supabase DB]
                                                    |
                                         [summarize_jobs 큐]
                                                    |
                                         [Ollama PC 워커] -> [팩트 요약 저장]
                                                    |
[Next.js 웹앱] <--- 조회 --- [Supabase DB] (요약 완료된 뉴스 표시)
```

---

## 개발 페이즈

### Phase 0: 프로젝트 기반 정비 (1~2일)

**목표:** Supabase Starter Kit의 보일러플레이트를 정리하고, Lifeboard 프로젝트로 브랜딩을 변경하며, 개발에 필요한 기본 환경을 설정한다.
**완료 기준:** Lifeboard 브랜딩이 적용된 레이아웃, 네비게이션이 동작하며, 불필요한 Starter Kit 코드가 제거된 상태.

#### 마일스톤 0.1: Starter Kit 정리 및 브랜딩 변경

- [x] 태스크 0.1.1: 루트 레이아웃 브랜딩 변경
  - 상세: `app/layout.tsx`에서 `title`을 "Lifeboard"로, `description`을 프로젝트 설명으로 변경. `lang="en"`을 `lang="ko"`로 변경.
  - 관련 파일: `app/layout.tsx`

- [x] 태스크 0.1.2: 홈 페이지 (`/`) 정리
  - 상세: `app/page.tsx`에서 `Hero`, `ConnectSupabaseSteps`, `SignUpUserSteps` 등 Starter Kit 튜토리얼 콘텐츠를 제거. Lifeboard 소개 텍스트와 로그인 유도 UI로 교체.
  - 관련 파일: `app/page.tsx`

- [x] 태스크 0.1.3: 불필요한 Starter Kit 컴포넌트 삭제
  - 상세: `components/deploy-button.tsx`, `components/hero.tsx`, `components/next-logo.tsx`, `components/supabase-logo.tsx`, `components/env-var-warning.tsx`, `components/tutorial/` 디렉토리 전체 삭제.
  - 관련 파일: `components/deploy-button.tsx`, `components/hero.tsx`, `components/next-logo.tsx`, `components/supabase-logo.tsx`, `components/env-var-warning.tsx`, `components/tutorial/*`

- [x] 태스크 0.1.4: protected 레이아웃 네비게이션 개편
  - 상세: `app/protected/layout.tsx`에서 "Next.js Supabase Starter" 텍스트를 "Lifeboard"로 변경. `DeployButton` 제거. "대시보드", "뉴스" 네비게이션 링크 추가. 모바일 반응형 네비게이션 적용.
  - 관련 파일: `app/protected/layout.tsx`

- [x] 태스크 0.1.5: Playwright MCP 테스트 - 브랜딩 변경 및 네비게이션
  - 사전 조건: 태스크 0.1.1 ~ 0.1.4 완료
  - 검증 항목:
    1. `browser_navigate`로 `/` 접근 -> "Lifeboard" 텍스트 존재 확인
    2. `browser_navigate`로 `/protected` 접근 -> 네비게이션에 "대시보드", "뉴스" 링크 존재 확인
    3. `browser_snapshot`으로 DeployButton, 튜토리얼 콘텐츠가 없는지 확인
    4. `browser_console_messages`로 에러 없음 확인
  - 결과: 스크린샷 저장 (`browser_take_screenshot`)

#### 마일스톤 0.2: 공통 레이아웃 컴포넌트 구성 (F012)

- [x] 태스크 0.2.1: 공통 헤더 컴포넌트 분리
  - 상세: `app/protected/layout.tsx`의 nav 영역을 `components/layout/header.tsx`로 분리. Lifeboard 로고, 네비게이션 링크(대시보드, 뉴스), AuthButton, ThemeSwitcher 포함.
  - 관련 파일: `components/layout/header.tsx`

- [x] 태스크 0.2.2: 반응형 모바일 네비게이션 구현
  - 상세: 768px 이하에서 햄버거 메뉴로 전환되는 모바일 네비게이션 구현. shadcn/ui `Sheet` 컴포넌트 활용.
  - 관련 파일: `components/layout/mobile-nav.tsx`

- [x] 태스크 0.2.3: 공통 푸터 컴포넌트 분리
  - 상세: `app/protected/layout.tsx`의 footer 영역을 `components/layout/footer.tsx`로 분리. "Powered by Supabase" 문구를 Lifeboard에 맞게 변경.
  - 관련 파일: `components/layout/footer.tsx`

- [x] 태스크 0.2.4: protected 레이아웃에 공통 컴포넌트 적용
  - 상세: `app/protected/layout.tsx`에서 분리한 `Header`, `Footer` 컴포넌트를 import하여 적용. 홈 페이지(`app/page.tsx`)에도 동일 헤더 적용.
  - 관련 파일: `app/protected/layout.tsx`, `app/page.tsx`

- [x] 태스크 0.2.5: Playwright MCP 테스트 - 반응형 레이아웃
  - 사전 조건: 태스크 0.2.1 ~ 0.2.4 완료
  - 검증 항목:
    1. `browser_navigate`로 `/protected` 접근 -> 헤더, 푸터 정상 렌더링 확인
    2. `browser_resize`로 768px 이하 설정 -> 모바일 메뉴 버튼 존재 확인
    3. `browser_click`으로 모바일 메뉴 열기 -> 네비게이션 링크 표시 확인
    4. `browser_resize`로 1024px 이상 설정 -> 데스크톱 네비게이션 표시 확인
    5. `browser_console_messages`로 에러 없음 확인
  - 결과: 모바일/데스크톱 스크린샷 각각 저장

---

### Phase 1: 데이터베이스 및 수집 파이프라인 (3~4일)

**목표:** Supabase에 뉴스 관련 테이블을 생성하고, RSS 수집 API, 제목 정규화, 중복 그룹핑, 수집 로그 기록까지 백엔드 파이프라인을 완성한다.
**완료 기준:** Vercel Cron 또는 수동 호출로 `/api/news/collect`를 실행하면, RSS 피드에서 기사가 수집되고 그룹핑되어 Supabase DB에 저장되며, `summarize_jobs`에 pending 작업이 생성된다.

#### 마일스톤 1.1: Supabase 데이터베이스 스키마 구축

- [x] 태스크 1.1.1: `news_sources` 테이블 생성 (Supabase Migration)
  - 상세: UUID PK, name(TEXT), feed_url(TEXT UNIQUE), category(TEXT), is_active(BOOLEAN DEFAULT true), last_fetched_at(TIMESTAMPTZ), created_at(TIMESTAMPTZ DEFAULT now()). RLS 정책: 인증 사용자 읽기 전용.
  - 관련 파일: `supabase/migrations/20260215000001_create_news_sources.sql`

- [x] 태스크 1.1.2: `news_article_groups` 테이블 생성
  - 상세: UUID PK, representative_article_id(UUID, nullable - 기사 삽입 후 갱신), category(TEXT), article_count(INTEGER DEFAULT 1), fact_summary(TEXT), is_summarized(BOOLEAN DEFAULT false), summarized_at(TIMESTAMPTZ), created_at(TIMESTAMPTZ DEFAULT now()). RLS: 인증 사용자 읽기 전용.
  - 관련 파일: `supabase/migrations/20260215000002_create_news_article_groups.sql`

- [x] 태스크 1.1.3: `news_articles` 테이블 생성
  - 상세: UUID PK, source_id(FK -> news_sources.id), guid(TEXT), title(TEXT), title_normalized(TEXT), description(TEXT), original_url(TEXT), author(TEXT), category(TEXT), published_at(TIMESTAMPTZ), image_url(TEXT), group_id(FK -> news_article_groups.id, nullable), created_at(TIMESTAMPTZ DEFAULT now()). UNIQUE(source_id, guid). RLS: 인증 사용자 읽기 전용. representative_article_id FK 연결.
  - 관련 파일: `supabase/migrations/20260215000003_create_news_articles.sql`

- [x] 태스크 1.1.4: `news_fetch_logs` 테이블 생성
  - 상세: UUID PK, source_id(FK -> news_sources.id), status(TEXT), articles_fetched(INTEGER), articles_new(INTEGER), error_message(TEXT), created_at(TIMESTAMPTZ DEFAULT now()). RLS: service_role만 접근 가능.
  - 관련 파일: `supabase/migrations/20260215000004_create_news_fetch_logs.sql`

- [x] 태스크 1.1.5: `summarize_jobs` 테이블 생성
  - 상세: UUID PK, group_id(FK -> news_article_groups.id), status(TEXT DEFAULT 'pending'), error_message(TEXT), requested_by(TEXT DEFAULT 'system'), created_at(TIMESTAMPTZ DEFAULT now()), started_at(TIMESTAMPTZ), completed_at(TIMESTAMPTZ). RLS: 인증 사용자 읽기 + INSERT, UPDATE는 service_role만.
  - 관련 파일: `supabase/migrations/20260215000005_create_summarize_jobs.sql`

- [x] 태스크 1.1.6: pg_trgm 확장 활성화 및 트라이그램 유사도 함수 생성
  - 상세: `CREATE EXTENSION IF NOT EXISTS pg_trgm;` 실행. `title_normalized` 컬럼에 GIN 인덱스 생성. 유사도 검색용 함수 작성 (similarity threshold 0.6).
  - 관련 파일: `supabase/migrations/20260215000006_enable_pg_trgm_and_functions.sql`

- [x] 태스크 1.1.7: 초기 RSS 소스 데이터 시드
  - 상세: PRD에 정의된 12개 한국 주요 언론사 RSS 피드 URL을 `news_sources` 테이블에 INSERT. 카테고리별(politics, economy, society, culture, science, world) 매핑.
  - 관련 파일: `supabase/migrations/20260215000007_seed_news_sources.sql`

#### 마일스톤 1.2: RSS 수집 API 구현 (F001)

- [x] 태스크 1.2.1: `rss-parser` 패키지 설치
  - 상세: `npm install rss-parser` 및 `npm install -D @types/rss-parser` (타입이 별도인 경우).
  - 관련 파일: `package.json`

- [x] 태스크 1.2.2: 제목 정규화 유틸리티 함수 구현
  - 상세: `[속보]`, `[단독]`, `[화제]` 등 태그 제거, 특수문자 제거, 공백 정리, 소문자 변환 함수. 단위 테스트용 예시 포함.
  - 관련 파일: `lib/news/normalize-title.ts`

- [x] 태스크 1.2.3: RSS 피드 파싱 서비스 구현
  - 상세: `rss-parser`를 사용하여 단일 RSS 피드 URL에서 기사 목록을 가져오는 함수. 5초 타임아웃 설정. 파싱 결과를 `news_articles` 삽입 형태로 변환.
  - 관련 파일: `lib/news/rss-fetcher.ts`

- [x] 태스크 1.2.4: 뉴스 그룹핑 서비스 구현 (F002)
  - 상세: Supabase RPC를 활용하여 `title_normalized` 기반 트라이그램 유사도 0.6 이상인 기사를 같은 그룹으로 묶는 함수. 새 그룹 생성 시 대표 기사 자동 선정 (가장 먼저 수집된 기사). 기존 그룹에 추가 시 `article_count` 갱신.
  - 관련 파일: `lib/news/grouping.ts`, `supabase/migrations/20260215000006_enable_pg_trgm_and_functions.sql`

- [x] 태스크 1.2.5: 수집 로그 기록 서비스 구현 (F011)
  - 상세: RSS 소스별 수집 결과(성공/실패, 수집 개수, 신규 개수, 에러 메시지)를 `news_fetch_logs` 테이블에 기록하는 함수. Supabase service_role 클라이언트 사용.
  - 관련 파일: `lib/news/fetch-logger.ts`

- [x] 태스크 1.2.6: 요약 작업 큐 생성 서비스 구현
  - 상세: 새 그룹 생성 시 `summarize_jobs` 테이블에 pending 작업을 INSERT하는 함수. `requested_by = 'system'`.
  - 관련 파일: `lib/news/summarize-queue.ts`

- [x] 태스크 1.2.7: RSS 수집 API Route 구현 (`/api/news/collect`)
  - 상세: GET/POST 핸들러. `CRON_SECRET` 헤더 검증. 활성화된 모든 RSS 소스를 병렬 fetch. 각 소스별로: RSS 파싱 -> 제목 정규화 -> DB INSERT (중복 스킵) -> 그룹핑 -> 요약 작업 생성 -> 로그 기록. 전체 결과 JSON 반환.
  - 관련 파일: `app/api/news/collect/route.ts`

- [x] 태스크 1.2.8: 환경 변수 설정 업데이트
  - 상세: `.env.local`에 `CRON_SECRET` 추가. `.env.example` 파일에 모든 환경 변수 템플릿 문서화.
  - 관련 파일: `.env.example`, `CLAUDE.md` (환경 변수 섹션 업데이트)

- [x] 태스크 1.2.9: Vercel Cron 설정 파일 작성
  - 상세: `vercel.json`에 Cron 설정 추가. 1시간마다 `/api/news/collect` 호출. `CRON_SECRET` 헤더 포함.
  - 관련 파일: `vercel.json`

- [x] 태스크 1.2.10: Playwright MCP 테스트 - RSS 수집 API
  - 사전 조건: 태스크 1.2.7 완료
  - 검증 항목:
    1. `browser_navigate`로 수동 API 호출 테스트 페이지 또는 curl 대체 확인
    2. `browser_network_requests`로 `/api/news/collect` 호출 시 200 응답 확인
    3. Supabase Dashboard에서 `news_articles`, `news_article_groups`, `news_fetch_logs` 테이블 데이터 존재 확인
    4. `browser_console_messages`로 에러 없음 확인
  - 결과: API 응답 JSON 캡처

---

### Phase 2: Ollama PC 워커 (2~3일)

**목표:** Ollama PC에서 실행되는 상주 워커 스크립트를 구현하여, Supabase `summarize_jobs` 큐의 pending 작업을 자동 감지하고 Ollama를 통해 팩트 요약을 처리한다.
**완료 기준:** 워커 스크립트가 Ollama PC에서 실행되면, pending 상태의 요약 작업을 자동으로 처리하고 `news_article_groups.fact_summary`에 결과를 저장한다.

#### 마일스톤 2.1: 워커 스크립트 구현 (F003)

- [x] 태스크 2.1.1: 워커 프로젝트 초기 설정
  - 상세: `scripts/` 디렉토리에 독립 패키지 생성. `package.json` (name: "lifeboard-worker", dependencies: @supabase/supabase-js, ollama, tsx), `.env.example` (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OLLAMA_BASE_URL, OLLAMA_MODEL), `tsconfig.json` 작성.
  - 관련 파일: `scripts/package.json`, `scripts/.env.example`, `scripts/tsconfig.json`

- [x] 태스크 2.1.2: Ollama 팩트 추출 모듈 구현
  - 상세: Ollama API (`ollama` npm 패키지)를 사용하여 뉴스 그룹 내 기사 제목+요약을 입력받아 팩트 요약을 생성하는 함수. PRD에 정의된 팩트 추출 프롬프트 적용. 타임아웃, 재시도 로직 포함.
  - 관련 파일: `scripts/summarizer.ts`

- [x] 태스크 2.1.3: 메인 워커 스크립트 구현
  - 상세: Supabase Realtime 구독으로 `summarize_jobs` INSERT 이벤트 감지. Realtime 연결 끊김 시 30초마다 폴링 폴백. pending 작업 감지 -> status를 processing으로 변경 -> 해당 그룹 기사 조회 -> `summarizer.ts`로 팩트 추출 -> `news_article_groups.fact_summary` 저장 -> status를 completed로 변경. 실패 시 status를 failed로 + error_message 기록. 동시 처리 방지를 위한 낙관적 잠금 (status 갱신 시 current_status 확인).
  - 관련 파일: `scripts/worker.ts`

- [x] 태스크 2.1.4: 워커 설정 가이드 문서 작성
  - 상세: Ollama PC 설정 방법 (Ollama 설치, 모델 다운로드, scripts/ 복사, npm install, .env 설정, npm start). Windows 서비스 등록 방법 (선택).
  - 관련 파일: `scripts/README.md`

---

### Phase 3: 프론트엔드 - 뉴스 표시 (3~4일)

**목표:** 수집 및 요약된 뉴스를 프론트엔드에서 표시한다. 뉴스 그룹 카드, 카테고리 필터, 대시보드 뉴스 섹션을 구현한다.
**완료 기준:** 로그인한 사용자가 대시보드에서 최신 뉴스 6개를 확인하고, 뉴스 페이지에서 카테고리별 필터링된 뉴스 그룹 카드를 탐색할 수 있다.

#### 마일스톤 3.1: Supabase 타입 생성 및 데이터 페칭 레이어

- [x] 태스크 3.1.1: Supabase 타입 생성
  - 상세: `npx supabase gen types typescript` 명령으로 DB 스키마 기반 TypeScript 타입 생성. 생성된 타입 파일을 프로젝트에 포함.
  - 관련 파일: `lib/supabase/database.types.ts`

- [x] 태스크 3.1.2: 뉴스 데이터 페칭 함수 구현
  - 상세: Server Component용 데이터 페칭 함수들. `getNewsGroups(category?: string, limit?: number)` - 뉴스 그룹 목록 조회 (대표 기사 정보 포함, is_summarized 기준 필터 가능). `getNewsGroupArticles(groupId: string)` - 그룹 내 기사 목록 조회. `getLatestNewsGroups(limit: number)` - 대시보드용 최신 뉴스 그룹 조회. Supabase Server Client 사용.
  - 관련 파일: `lib/news/queries.ts`

#### 마일스톤 3.2: 뉴스 그룹 카드 컴포넌트 (F005)

- [x] 태스크 3.2.1: shadcn/ui 추가 컴포넌트 설치
  - 상세: `npx shadcn@latest add tabs skeleton separator scroll-area` 실행. 뉴스 UI에 필요한 shadcn/ui 컴포넌트 추가.
  - 관련 파일: `components/ui/tabs.tsx`, `components/ui/skeleton.tsx`, `components/ui/separator.tsx`, `components/ui/scroll-area.tsx`

- [x] 태스크 3.2.2: 뉴스 그룹 카드 컴포넌트 구현
  - 상세: `components/news/news-group-card.tsx` 구현. shadcn/ui `Card` 기반. 표시 항목: 대표 기사 제목, AI 팩트 요약 (불릿 포인트, `fact_summary` 파싱), 그룹 내 기사 개수 배지, 카테고리 배지, 발행시간 (상대 시간 표시), 원문 링크 목록 (언론사명 + 링크). 요약 미완료 시 원본 description으로 임시 표시 또는 "요약 처리 중" 표시.
  - 관련 파일: `components/news/news-group-card.tsx`

- [x] 태스크 3.2.3: 뉴스 스켈레톤 로딩 컴포넌트 구현
  - 상세: `components/news/news-skeleton.tsx` 구현. shadcn/ui `Skeleton` 기반. 뉴스 그룹 카드의 로딩 상태 표시. Suspense fallback으로 사용.
  - 관련 파일: `components/news/news-skeleton.tsx`

- [x] 태스크 3.2.4: 상대 시간 표시 유틸리티 구현
  - 상세: `published_at`을 "3시간 전", "어제", "2일 전" 등으로 변환하는 함수. 외부 라이브러리 없이 구현하거나 가벼운 라이브러리 사용.
  - 관련 파일: `lib/utils/format-time.ts`

- [x] 태스크 3.2.5: Playwright MCP 테스트 - 뉴스 그룹 카드 렌더링
  - 사전 조건: 태스크 3.2.2 완료, DB에 테스트 데이터 존재
  - 검증 항목:
    1. `browser_navigate`로 `/protected/news` 접근 -> 페이지 정상 로드
    2. `browser_snapshot`으로 뉴스 그룹 카드 존재 확인 (제목, 요약, 원문 링크)
    3. `browser_click`으로 원문 링크 클릭 -> 외부 사이트로 이동 확인
    4. `browser_console_messages`로 에러 없음 확인
  - 결과: 스크린샷 저장

#### 마일스톤 3.3: 카테고리 필터 (F004)

- [x] 태스크 3.3.1: 카테고리 탭 컴포넌트 구현
  - 상세: `components/news/news-category-tabs.tsx` 구현. shadcn/ui `Tabs` 기반. 카테고리 목록: 전체, 정치(politics), 경제(economy), 사회(society), 생활/문화(culture), IT/과학(science), 세계(world). URL 쿼리 파라미터 `?category=` 와 동기화. 선택된 탭 상태 유지.
  - 관련 파일: `components/news/news-category-tabs.tsx`

- [x] 태스크 3.3.2: 뉴스 목록 컴포넌트 구현
  - 상세: `components/news/news-list.tsx` 구현. 뉴스 그룹 카드 그리드. 반응형: 모바일 1열, 태블릿/데스크톱 2열. 데이터 없을 때 빈 상태 메시지 표시.
  - 관련 파일: `components/news/news-list.tsx`

- [x] 태스크 3.3.3: 뉴스 목록 페이지 구현 (`/protected/news`)
  - 상세: `app/protected/news/page.tsx` 구현. Server Component. `searchParams`에서 `category` 파라미터 추출. `getNewsGroups(category)` 호출. `NewsCategoryTabs` + `NewsList` 조합. `Suspense` + `NewsSkeleton` fallback 적용.
  - 관련 파일: `app/protected/news/page.tsx`

- [x] 태스크 3.3.4: Playwright MCP 테스트 - 카테고리 필터링
  - 사전 조건: 태스크 3.3.3 완료
  - 검증 항목:
    1. `browser_navigate`로 `/protected/news` 접근 -> "전체" 탭 활성 상태 확인
    2. `browser_click`으로 "경제" 탭 클릭 -> URL이 `?category=economy`로 변경 확인
    3. `browser_snapshot`으로 경제 카테고리 뉴스만 표시 확인
    4. `browser_click`으로 "전체" 탭 복귀 -> 모든 카테고리 뉴스 표시 확인
    5. `browser_network_requests`로 Supabase API 호출 확인
    6. `browser_console_messages`로 에러 없음 확인
  - 결과: 각 카테고리 탭 상태 스크린샷 저장

#### 마일스톤 3.4: 뉴스 대시보드 섹션 (F006)

- [x] 태스크 3.4.1: 대시보드 뉴스 섹션 컴포넌트 구현
  - 상세: `components/news/news-dashboard-section.tsx` 구현. 섹션 제목 ("최신 뉴스"), 최신 6개 뉴스 그룹 카드 그리드 (반응형 1열/2열), "더보기" 버튼 (`/protected/news` 링크).
  - 관련 파일: `components/news/news-dashboard-section.tsx`

- [x] 태스크 3.4.2: 대시보드 메인 페이지 개편 (`/protected`)
  - 상세: `app/protected/page.tsx`에서 Starter Kit 튜토리얼 콘텐츠 제거. `NewsDashboardSection` 컴포넌트 배치. Server Component로 `getLatestNewsGroups(6)` 호출. `Suspense` + 스켈레톤 fallback 적용. 향후 다른 라이프 데이터 섹션 추가를 위한 구조 마련 (섹션 간 간격 등).
  - 관련 파일: `app/protected/page.tsx`

- [x] 태스크 3.4.3: Playwright MCP 테스트 - 대시보드 뉴스 섹션
  - 사전 조건: 태스크 3.4.2 완료
  - 검증 항목:
    1. `browser_navigate`로 `/protected` 접근 -> "최신 뉴스" 섹션 존재 확인
    2. `browser_snapshot`으로 최대 6개 뉴스 카드 표시 확인
    3. `browser_click`으로 "더보기" 버튼 클릭 -> `/protected/news`로 이동 확인
    4. `browser_network_requests`로 Supabase 뉴스 데이터 조회 API 호출 확인
    5. `browser_console_messages`로 에러 없음 확인
  - 결과: 대시보드 스크린샷 저장

---

### Phase 4: 페이지네이션 및 UX 개선 (1~2일)

**목표:** 뉴스 목록의 페이지네이션과 전반적인 사용자 경험을 개선한다.
**완료 기준:** 뉴스 목록에서 페이지네이션이 동작하고, 로딩/빈 상태/에러 상태가 적절히 처리된다.

#### 마일스톤 4.1: 페이지네이션

- [x] 태스크 4.1.1: 페이지네이션 컴포넌트 구현
  - 상세: `components/news/news-pagination.tsx` 구현. 커서 기반 또는 오프셋 기반 페이지네이션. URL 쿼리 파라미터 `?page=` 와 동기화. 이전/다음 버튼. 페이지당 20개 뉴스 그룹 표시.
  - 관련 파일: `components/news/news-pagination.tsx`

- [x] 태스크 4.1.2: 뉴스 데이터 페칭 함수에 페이지네이션 적용
  - 상세: `getNewsGroups()` 함수에 `page`, `pageSize` 파라미터 추가. 전체 개수 조회 포함. Supabase `range()` 메서드 활용.
  - 관련 파일: `lib/news/queries.ts`

- [x] 태스크 4.1.3: 뉴스 목록 페이지에 페이지네이션 통합
  - 상세: `app/protected/news/page.tsx`에서 `searchParams`의 `page` 파라미터 처리. `NewsPagination` 컴포넌트 배치.
  - 관련 파일: `app/protected/news/page.tsx`

- [x] 태스크 4.1.4: Playwright MCP 테스트 - 페이지네이션
  - 사전 조건: 태스크 4.1.3 완료, DB에 20개 이상 뉴스 그룹 존재
  - 검증 항목:
    1. `browser_navigate`로 `/protected/news` 접근 -> 첫 페이지 뉴스 표시 확인
    2. `browser_click`으로 "다음" 버튼 클릭 -> URL에 `?page=2` 반영, 다른 뉴스 표시 확인
    3. `browser_click`으로 "이전" 버튼 클릭 -> 첫 페이지 복귀 확인
    4. `browser_console_messages`로 에러 없음 확인
  - 결과: 페이지네이션 동작 스크린샷 저장

#### 마일스톤 4.2: 에러 및 빈 상태 처리

- [x] 태스크 4.2.1: 뉴스 빈 상태 컴포넌트 구현
  - 상세: `components/news/news-empty-state.tsx` 구현. 뉴스가 없을 때 표시할 안내 메시지. 카테고리별 빈 상태와 전체 빈 상태 구분.
  - 관련 파일: `components/news/news-empty-state.tsx`

- [x] 태스크 4.2.2: 에러 바운더리 및 에러 페이지 구현
  - 상세: `app/protected/news/error.tsx` 에러 UI. `app/protected/news/loading.tsx` 로딩 UI (NewsSkeleton 활용). Next.js App Router의 에러/로딩 컨벤션 활용.
  - 관련 파일: `app/protected/news/error.tsx`, `app/protected/news/loading.tsx`

- [x] 태스크 4.2.3: Playwright MCP 테스트 - 빈 상태 및 로딩 처리
  - 사전 조건: 태스크 4.2.2 완료
  - 검증 항목:
    1. `browser_navigate`로 뉴스가 없는 카테고리 접근 -> 빈 상태 메시지 표시 확인
    2. `browser_snapshot`으로 빈 상태 UI 확인
    3. `browser_console_messages`로 에러 없음 확인
  - 결과: 빈 상태 스크린샷 저장

---

### Phase 5: 통합 테스트 및 배포 준비 (1~2일)

**목표:** 전체 시스템을 통합 테스트하고 프로덕션 배포를 준비한다.
**완료 기준:** Vercel에 배포된 상태에서 RSS 수집 -> 그룹핑 -> AI 요약 -> 프론트엔드 표시까지 전체 파이프라인이 정상 동작한다.

#### 마일스톤 5.1: 통합 테스트

- [ ] 태스크 5.1.1: 전체 파이프라인 수동 통합 테스트
  - 상세: 개발 환경에서 `/api/news/collect` 호출 -> DB에 기사/그룹 저장 확인 -> Ollama 워커로 요약 처리 확인 -> `/protected` 대시보드에서 뉴스 표시 확인 -> `/protected/news`에서 카테고리 필터 동작 확인. 각 단계별 결과 기록.

- [ ] 태스크 5.1.2: Playwright MCP 테스트 - 전체 사용자 여정
  - 검증 항목:
    1. `browser_navigate`로 `/` 접근 -> 홈 페이지 로드
    2. `browser_navigate`로 `/auth/login` 접근 -> 로그인 폼 표시
    3. `browser_fill_form`으로 테스트 계정 로그인
    4. `browser_snapshot`으로 `/protected` 대시보드 뉴스 섹션 확인
    5. `browser_click`으로 "뉴스" 네비게이션 클릭 -> `/protected/news` 이동
    6. `browser_click`으로 카테고리 탭 전환 확인
    7. `browser_click`으로 원문 링크 클릭 -> 외부 사이트 이동
    8. `browser_console_messages`로 전체 과정에서 에러 없음 확인
  - 결과: 각 단계별 스크린샷 저장

#### 마일스톤 5.2: 배포 준비

- [ ] 태스크 5.2.1: 프로덕션 환경 변수 설정
  - 상세: Vercel 프로젝트에 환경 변수 설정 (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `CRON_SECRET`). Supabase 프로젝트 RLS 정책 최종 확인.

- [ ] 태스크 5.2.2: 프로덕션 빌드 검증
  - 상세: `npm run build` 실행하여 빌드 에러 없음 확인. `npm run lint` 통과 확인. TypeScript 타입 에러 없음 확인.

- [ ] 태스크 5.2.3: Vercel 배포 및 Cron 동작 확인
  - 상세: Vercel에 배포. Cron 설정이 올바르게 등록되었는지 확인. 첫 번째 Cron 실행 후 DB에 데이터가 수집되는지 확인.

- [ ] 태스크 5.2.4: Ollama PC 워커 프로덕션 설정
  - 상세: Ollama PC에 `scripts/` 배포. 프로덕션 Supabase URL/키 설정. 워커 시작 및 요약 처리 확인.

---

## 우선순위 매트릭스

| 기능                | ID   | 우선순위 | 복잡도 | 페이즈 | 의존성                    |
| ------------------- | ---- | -------- | ------ | ------ | ------------------------- |
| 프로젝트 기반 정비  | -    | Must     | 낮음   | 0      | 없음                      |
| 반응형 레이아웃     | F012 | Must     | 중간   | 0      | 없음                      |
| DB 스키마 구축      | -    | Must     | 중간   | 1      | Phase 0                   |
| RSS 뉴스 수집       | F001 | Must     | 높음   | 1      | DB 스키마                 |
| 중복 기사 그룹핑    | F002 | Must     | 높음   | 1      | F001, pg_trgm             |
| 수집 로그 관리      | F011 | Must     | 낮음   | 1      | F001                      |
| AI 팩트 요약        | F003 | Must     | 높음   | 2      | F001, F002                |
| 뉴스 그룹 카드 표시 | F005 | Must     | 중간   | 3      | F001, F002                |
| 뉴스 카테고리 필터  | F004 | Must     | 중간   | 3      | F005                      |
| 뉴스 대시보드 섹션  | F006 | Must     | 중간   | 3      | F005                      |
| 기본 인증           | F010 | Must     | 낮음   | -      | 이미 구현됨 (Starter Kit) |
| 페이지네이션        | -    | Should   | 중간   | 4      | F004, F005                |
| 에러/빈 상태 처리   | -    | Should   | 낮음   | 4      | F005                      |

## 리스크 및 고려사항

### 기술적 리스크

- **RSS 피드 가용성**: 한국 언론사 RSS 피드가 불안정하거나 URL이 변경될 수 있음. 각 피드별 5초 타임아웃과 에러 핸들링으로 대응. 수집 로그(F011)로 모니터링.
- **pg_trgm 유사도 정확도**: 트라이그램 유사도 0.6 임계값이 한국어 뉴스 제목에 최적인지 검증 필요. 임계값 조정이 필요할 수 있음.
- **Ollama PC 의존성**: 별도 PC에서 Ollama가 상시 실행되어야 함. PC 종료, 네트워크 단절 시 요약 처리 중단. 워커의 Realtime 연결 끊김 시 폴링 폴백으로 대응.
- **Vercel Cron 제한**: Vercel Hobby 플랜은 Cron 실행 빈도에 제한이 있을 수 있음 (1일 1회). Pro 플랜 확인 필요.

### 일정 리스크

- **Supabase Migration 관리**: 로컬 Supabase CLI 설정이 필요하며, 마이그레이션 충돌에 주의 필요.
- **Ollama 모델 다운로드**: qwen2.5:14b 모델은 약 8GB로, 초기 다운로드에 시간이 소요됨.

### 의존성 리스크

- **Supabase Realtime**: summarize_jobs 테이블의 Realtime 구독이 RLS 정책과 충돌하지 않는지 확인 필요. service_role 키 사용 시 Realtime bypass 가능 여부 확인.
- **rss-parser와 Next.js 호환성**: rss-parser가 Node.js 환경에서만 동작하므로, API Route (서버 사이드)에서만 사용해야 함. Edge Runtime에서는 사용 불가.

### 보안 고려사항

- **CRON_SECRET**: RSS 수집 API에 대한 무단 호출 방지. 환경 변수로 관리.
- **SUPABASE_SERVICE_ROLE_KEY**: Ollama PC 워커에서만 사용. 절대 클라이언트에 노출 금지.
- **RLS 정책**: 모든 테이블에 적절한 RLS 정책 적용. 인증 사용자 읽기 전용, service_role만 쓰기.

## 가정 사항

- Supabase 프로젝트가 이미 생성되어 있고, 환경 변수가 `.env.local`에 설정되어 있다고 가정.
- Ollama PC는 같은 LAN 내에 별도로 존재하며, Ollama가 설치되어 있다고 가정.
- Vercel 배포 환경이 준비되어 있다고 가정 (GitHub 연동 등).
- F010(기본 인증)은 Supabase Starter Kit에서 이미 구현된 상태이므로, 별도 페이즈 없이 기존 코드를 활용한다.

## 변경 이력

| 날짜       | 버전 | 변경 내용                        |
| ---------- | ---- | -------------------------------- |
| 2026-02-14 | 1.0  | 초기 로드맵 생성 (PRD v1.0 기반) |

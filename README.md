# Lifeboard (라이프보드)

인생의 모든 데이터를 한눈에 볼 수 있는 통합 대시보드 웹 애플리케이션.

**현재 버전**: v1.1b (사용자 경험 개선)
**프로덕션**: https://lifeboard-omega.vercel.app

MVP(v1.0)는 한국 주요 언론사 RSS 뉴스 수집, AI 기반 팩트 요약, 카테고리별 뉴스 탐색 기능에 집중합니다. v1.1a에서는 뉴스 카드 UI 간소화, 상세 페이지, AI 품질 관리, 콘텐츠 필터링 기능을 추가했습니다. v1.1b에서는 소셜 로그인(Google, Kakao, Apple), 뉴스 검색, 북마크, 공유, 사용자 설정 페이지를 추가했습니다.

## 주요 기능

### v1.0 (MVP)

- **RSS 뉴스 자동 수집** - 한국 주요 언론사 20+ 피드에서 뉴스를 자동 수집 (하루 2회, KST 8시/20시)
- **유사 기사 그룹핑** - pg_trgm 트라이그램 유사도 기반으로 같은 사안의 기사를 자동 그룹화 (유사도 임계값 0.5, 72시간 범위)
- **AI 팩트 요약** - Ollama(qwen2.5:14b)를 활용하여 핵심 팩트를 불릿 포인트로 요약
- **카테고리별 탐색** - 정치, 경제, 사회, 생활/문화, IT/과학, 세계 6개 카테고리 필터
- **페이지네이션** - URL 기반 페이지네이션 (페이지당 20개)
- **반응형 대시보드** - 데스크톱/모바일 반응형 레이아웃, 다크모드 지원
- **이메일 인증** - Supabase Auth 기반 이메일 OTP 회원가입/로그인

### v1.1a (뉴스 UX 개선)

- **뉴스 상세 페이지** - 팩트 요약 + 관련 기사 목록 + 메타정보를 별도 페이지에서 확인
- **간소화된 카드 UI** - 뉴스 목록에서 이미지 + 제목 + 메타정보만 표시, 상세 내용은 클릭 시 확인
- **AI 품질 관리** - 한국어 검증 (한글 비율 70% 이상), 품질 플래그(`is_valid`)로 필터링
- **콘텐츠 필터링** - 키워드 블랙리스트/화이트리스트 기반 불필요 기사 자동 제거
- **마크다운 렌더링** - 팩트 요약을 react-markdown으로 렌더링 (불릿 포인트, 링크 등)
- **상대 시간 표시** - "3시간 전", "2일 전" 형식으로 발행 시간 표시

### v1.1b (사용자 경험 개선)

- **소셜 로그인** - Google, Kakao, Apple OAuth 통합, 기존 이메일/비밀번호 인증 제거
- **뉴스 검색** - pg_trgm 유사도 기반 전체 텍스트 검색 (제목 및 팩트 요약)
- **북마크 기능** - 최대 100개 뉴스 북마크, 낙관적 UI 업데이트 (useOptimistic), 전용 탭
- **뉴스 공유** - 팩트 요약 및 링크 클립보드 복사, Toast 알림 (sonner)
- **사용자 설정** - 프로필 정보 확인 (로그인 방식, 이메일, 가입일), 선호 카테고리 관리
- **개발용 로그인** - 테스트 사용자 자동 생성 API (개발 환경 전용)

## 기술 스택

| 영역       | 기술                                                     |
| ---------- | -------------------------------------------------------- |
| 프레임워크 | Next.js 16 (App Router, Turbopack, Cache Components)     |
| UI         | React 19, Tailwind CSS 4, shadcn/ui (new-york), Radix UI |
| 백엔드     | Supabase (PostgreSQL, Auth, RLS, RPC, Realtime)          |
| AI 요약    | Ollama (qwen2.5:14b, 로컬 LLM)                           |
| 코드 품질  | Prettier, ESLint, Husky + lint-staged, Playwright        |
| 배포       | Vercel (Cron 작업 포함)                                  |

## 아키텍처

```
[Vercel Cron 하루 2회] → [/api/news/collect] → RSS 파싱
                                                    ↓
                                          콘텐츠 필터링 (v1.1a)
                                                    ↓
                                         중복 필터링 + DB INSERT
                                                    ↓
                                      [Supabase DB] ← 그룹핑 (유사도 0.5)
                                                    ↓
                                         [summarize_jobs 큐]
                                                    ↓
                                         [Ollama PC 워커]
                                           qwen2.5:14b
                                           한국어 검증 (v1.1a)
                                                    ↓
                                         [팩트 요약 저장 + is_valid 플래그]
                                                    ↓
[Next.js 웹앱] ←── 조회 (is_valid=true만) ── [Supabase DB]
```

시스템은 세 부분으로 구성됩니다:

1. **Vercel 웹앱 + Cron** - Next.js App Router 기반 웹 애플리케이션. Vercel Cron이 하루 2회(KST 8시, 20시) RSS 수집 API를 호출하여 뉴스를 수집하고 콘텐츠 필터링을 적용
2. **Supabase PostgreSQL** - 데이터 저장소이자 메시지 큐 역할. `summarize_jobs` 테이블이 Vercel과 Ollama PC 사이의 작업 큐로 동작. `content_filters` 테이블로 필터링 규칙 관리
3. **Ollama PC 워커** - 별도 PC에서 `qwen2.5:14b` 모델을 구동. Supabase Realtime/폴링으로 pending 작업을 감지하여 팩트 요약을 생성하고 한국어 품질을 검증

## 시작하기

### 사전 요구사항

- Node.js 20+
- [Supabase 프로젝트](https://database.new)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (마이그레이션 적용용)

### 설치 및 실행

```bash
npm install
```

`.env.example`을 참고하여 `.env.local` 파일을 생성합니다:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<supabase-publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<supabase-service-role-key>
CRON_SECRET=<랜덤-시크릿>
```

> `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`는 Supabase 대시보드의 anon key와 동일합니다.
> [API 설정](https://supabase.com/dashboard/project/_?showConnect=true)에서 확인할 수 있습니다.

DB 마이그레이션을 적용합니다:

```bash
npx supabase db push
```

### OAuth Provider 설정 (소셜 로그인용)

v1.1b부터 소셜 로그인(Google, Kakao)을 지원합니다. Supabase 대시보드에서 OAuth Provider를 설정하세요:

1. [Supabase Dashboard](https://supabase.com/dashboard) → 프로젝트 선택 → **Authentication** → **Providers**
2. **Google** 활성화:
   - [Google Cloud Console](https://console.cloud.google.com/)에서 OAuth 2.0 클라이언트 ID 생성
   - Authorized redirect URIs: `https://<project-ref>.supabase.co/auth/v1/callback`
   - Client ID와 Client Secret을 Supabase에 입력
3. **Kakao** 활성화:
   - [Kakao Developers](https://developers.kakao.com/)에서 앱 생성 및 설정
   - Redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
   - Client ID(REST API 키)와 Client Secret을 Supabase에 입력

개발 서버를 실행합니다:

```bash
npm run dev
```

[localhost:3000](http://localhost:3000/)에서 확인합니다.

> **개발 환경 로그인**: `/api/auth/dev-login` API를 사용하여 테스트 계정으로 빠르게 로그인할 수 있습니다 (.env.local의 TEST_USER_EMAIL/PASSWORD 사용).

### Ollama 워커 설정 (AI 요약용)

`scripts/` 디렉토리는 메인 프로젝트와 독립된 패키지입니다. Ollama가 설치된 PC에서 실행합니다.

```bash
cd scripts
npm install
```

`scripts/.env.example`을 참고하여 `scripts/.env` 파일을 생성합니다:

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<supabase-service-role-key>
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:14b
```

Ollama 모델을 다운로드하고 워커를 실행합니다:

```bash
ollama pull qwen2.5:14b
npm start
```

워커는 Supabase Realtime 구독 + 30초 폴링으로 pending 작업을 자동 감지하여 처리합니다. v1.1a부터는 요약 생성 후 한국어 품질을 검증하여 `is_valid` 플래그를 설정합니다.

## 개발 명령어

```bash
npm run dev             # 개발 서버 (localhost:3000)
npm run build           # 프로덕션 빌드 (Turbopack)
npm run lint            # ESLint
npm run lint:fix        # ESLint 자동 수정
npm run format          # Prettier 전체 포매팅
npm run format:check    # Prettier 포매팅 상태 확인
npm run type-check      # TypeScript 타입 검사
npx playwright test     # E2E 테스트 실행
npx playwright test --ui # 테스트 UI 모드
npx supabase db push    # DB 마이그레이션 적용 (원격 Supabase)
```

## 프로젝트 구조

```
app/
  api/
    auth/dev-login/        # 개발용 로그인 API (v1.1b)
    news/
      collect/             #   RSS 수집 API (Vercel Cron)
      bookmarks/           #   북마크 API (v1.1b)
    user/preferences/      # 사용자 설정 API (v1.1b)
  auth/
    login/                 # 소셜 로그인 페이지 (v1.1b)
    callback/              # OAuth 콜백 핸들러 (v1.1b)
  protected/               # 인증 필요 페이지
    page.tsx               #   대시보드 (최신 뉴스 6개)
    news/
      page.tsx             #   뉴스 목록 (카테고리 + 검색 + 북마크 탭, v1.1b)
      [groupId]/page.tsx   #   뉴스 상세 페이지 (v1.1a)
    settings/              #   사용자 설정 페이지 (v1.1b)
components/
  layout/                  # 공통 레이아웃 (헤더, 모바일 네비게이션, 푸터)
  news/                    # 뉴스 UI 컴포넌트
    news-group-card.tsx    #   뉴스 카드 (간소화된 UI, v1.1a)
    news-detail.tsx        #   뉴스 상세 레이아웃 (v1.1a)
    news-search-bar.tsx    #   검색 바 (v1.1b)
    bookmark-button.tsx    #   북마크 버튼 (낙관적 UI, v1.1b)
    share-button.tsx       #   공유 버튼 (v1.1b)
    fact-summary-card.tsx  #   팩트 요약 카드 (v1.1a)
    related-articles-list.tsx # 관련 기사 목록 (v1.1a)
    markdown-fact.tsx      #   마크다운 렌더링 (v1.1a)
    relative-time.tsx      #   상대 시간 표시 (v1.1a)
    news-category-tabs.tsx #   카테고리 탭 필터 (북마크 탭 추가, v1.1b)
    news-list.tsx          #   뉴스 카드 그리드
    news-pagination.tsx    #   페이지네이션
    news-skeleton.tsx      #   로딩 스켈레톤
    news-empty-state.tsx   #   빈 상태 안내
    news-dashboard-section.tsx # 대시보드 뉴스 섹션
    category-gradient.tsx  #   카테고리 그라디언트 (v1.1a)
  settings/                # 사용자 설정 컴포넌트 (v1.1b)
    profile-section.tsx    #   프로필 정보
    category-preferences.tsx # 선호 카테고리 설정
  ui/                      # shadcn/ui 컴포넌트
    sonner.tsx             #   Toast 알림 (v1.1b)
  social-login-buttons.tsx # 소셜 로그인 버튼 (v1.1b)
lib/
  news/                    # 뉴스 파이프라인
    rss-fetcher.ts         #   RSS 피드 파싱
    normalize-title.ts     #   제목 정규화 (태그 제거, 정규화)
    grouping.ts            #   트라이그램 유사도 그룹핑
    content-filter.ts      #   콘텐츠 필터링 (v1.1a)
    summarize-queue.ts     #   요약 작업 큐 생성
    cleanup.ts             #   오래된 레코드 정리
    fetch-logger.ts        #   수집 로그 기록
    queries.ts             #   프론트엔드 데이터 페칭
    categories.ts          #   카테고리 상수
    types.ts               #   타입 정의
  supabase/                # Supabase 클라이언트 (server, client, proxy, admin, env)
  utils/                   # 유틸리티
    format-time.ts         #   상대 시간 포맷
    news-image.ts          #   이미지 폴백 처리 (v1.1a)
scripts/                   # Ollama PC 워커 (독립 패키지)
  worker.ts                #   메인 워커
  summarizer.ts            #   팩트 추출 + 한국어 검증 (v1.1a)
supabase/
  migrations/              # DB 마이그레이션 SQL 파일
docs/
  PRD.md                   # 제품 요구사항 (v2.4)
  ROADMAP.md               # 개발 로드맵 (v1.1b 완료)
  complete/                # 완료된 로드맵 아카이브
tests/                     # E2E 테스트 (Playwright)
  auth.setup.ts            #   인증 설정
  news-search.spec.ts      #   뉴스 검색 테스트
```

## 데이터베이스 스키마

| 테이블                 | 설명                                                                              |
| ---------------------- | --------------------------------------------------------------------------------- |
| `news_sources`         | RSS 피드 소스 (언론사명, 피드 URL, 카테고리)                                      |
| `news_article_groups`  | 유사 기사 그룹 (대표 기사, 팩트 요약, 카테고리, **`is_valid` 품질 플래그** v1.1a) |
| `news_articles`        | 개별 기사 (제목, URL, 소스, 그룹 연결, **`is_deleted` soft delete** v1.1a)        |
| `news_fetch_logs`      | 수집 로그 (소스별 성공/실패, 수집 개수, **`filtered_count` 필터링 개수** v1.1a)   |
| `summarize_jobs`       | AI 요약 작업 큐 (상태: pending/processing/completed/failed)                       |
| `content_filters`      | 콘텐츠 필터링 규칙 (블랙리스트/화이트리스트 키워드) v1.1a                         |
| **`user_preferences`** | **사용자 설정 (선호 카테고리, 대시보드 설정)** v1.1b                              |
| **`user_bookmarks`**   | **사용자 북마크 (뉴스 그룹 ID, 최대 100개 제한)** v1.1b                           |

### RPC 함수

| 함수                          | 설명                                                                       |
| ----------------------------- | -------------------------------------------------------------------------- |
| `find_similar_group`          | 트라이그램 유사도 기반 그룹 검색                                           |
| `increment_article_count`     | 그룹 기사 수 갱신                                                          |
| `cleanup_old_records`         | 오래된 로그/작업 정리 (90일 로그, 30일 완료 작업)                          |
| `enqueue_summarize_jobs`      | 요약 작업 일괄 등록                                                        |
| `get_top_articles_for_groups` | 그룹별 상위 N개 기사 조회                                                  |
| `batch_group_articles`        | 배치 그룹핑 (**유사도 임계값 0.5, 72시간 범위**, 단일 트랜잭션) v1.1a 조정 |
| **`get_user_bookmarks`**      | **북마크 목록 조회 (JOIN으로 뉴스 그룹 정보 포함)** v1.1b                  |
| **`search_news_groups`**      | **뉴스 검색 (pg_trgm 유사도 기반, 제목 및 요약 검색)** v1.1b               |

## 개발 진행 상황

### v1.0 (MVP) - 완료 (2026-02-16)

- [x] **Phase 0** - 프로젝트 기반 정비, 브랜딩, 공통 레이아웃
- [x] **Phase 1** - DB 스키마 + RSS 수집 파이프라인
- [x] **Phase 2** - Ollama PC 워커
- [x] **Phase 3** - 프론트엔드 뉴스 표시
- [x] **Phase 4** - 페이지네이션 + UX 개선
- [x] **Phase 5** - 통합 테스트 + 배포 준비

### v1.1a (뉴스 UX 개선) - 완료 (2026-02-16)

- [x] **마일스톤 1a.1** - AI 요약 품질 관리 + 그룹핑 개선 + 콘텐츠 필터링
- [x] **마일스톤 1a.2** - 뉴스 카드 UI 간소화
- [x] **마일스톤 1a.3** - 뉴스 상세 페이지 + 통일된 팩트 요약 폼

### v1.1b (사용자 경험 개선) - 완료 (2026-02-16)

- [x] 소셜 로그인 (Google, Kakao, Apple)
- [x] 뉴스 검색
- [x] 북마크 기능
- [x] 사용자 설정 페이지
- [x] 뉴스 공유

## 문서

- [PRD](docs/PRD.md) - 제품 요구사항 문서 (v2.4, 2026-02-16)
- [ROADMAP](docs/ROADMAP.md) - 개발 로드맵 (v1.1b 완료)
- [CLAUDE.md](CLAUDE.md) - Claude Code 작업 가이드
- [완료된 로드맵](docs/complete/) - v1.0 (Phase 0~5) 아카이브

## 라이선스

Private

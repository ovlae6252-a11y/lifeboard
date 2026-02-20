# Lifeboard (라이프보드)

인생의 모든 데이터를 한눈에 볼 수 있는 통합 대시보드 웹 애플리케이션.

**현재 버전**: v1.1d 완료 (2026-02-18), v1.2 개발 중
**프로덕션**: https://lifeboard-omega.vercel.app

## 주요 기능

### v1.0 (MVP)

- **RSS 뉴스 자동 수집** - 한국 주요 언론사 20+ 피드에서 하루 2회 자동 수집 (KST 8시/20시)
- **유사 기사 그룹핑** - pg_trgm 트라이그램 유사도 기반 그룹화 (임계값 0.5, 72시간 범위)
- **AI 팩트 요약** - Ollama(qwen2.5:14b)로 뉴스 요약 생성 + 한국어 품질 검증
- **카테고리별 탐색** - 정치, 경제, 사회, 생활/문화, IT/과학, 세계 6개 카테고리
- **페이지네이션** - URL 기반, 페이지당 20개
- **반응형 대시보드** - 데스크톱/모바일 반응형, 다크모드 지원

### v1.1a (뉴스 UX 개선)

- **뉴스 상세 페이지** - 팩트 요약 + 관련 기사 목록을 별도 페이지로 제공
- **AI 품질 관리** - 한국어 비율 70% 이상 검증, `is_valid` 플래그 필터링
- **콘텐츠 필터링** - 키워드 블랙리스트/화이트리스트 기반 불필요 기사 제거
- **마크다운 렌더링** - react-markdown으로 팩트 요약 렌더링

### v1.1b (사용자 경험 개선)

- **소셜 로그인** - Google, Kakao OAuth 통합
- **뉴스 검색** - pg_trgm 유사도 기반 제목 및 팩트 요약 검색
- **북마크** - 최대 100개, 낙관적 UI 업데이트 (`useOptimistic`)
- **뉴스 공유** - 팩트 요약/링크 클립보드 복사, Toast 알림
- **사용자 설정** - 프로필 확인, 선호 카테고리 관리

### v1.1c (관리자 시스템)

- **관리자 역할** - `app_metadata.role` 기반 접근 제어, `/admin/*` 라우트 보호
- **관리자 대시보드** - 시스템 통계, 파이프라인 상태, 수집량/카테고리 차트, 활동 로그
- **뉴스 관리** - 소스 관리, 그룹 숨김/요약 재실행, 기사 soft delete/그룹 변경

### v1.1d (관리자 시스템 확장 + 날씨 위젯)

- **날씨 위젯** - OpenWeatherMap 연동, 현재 날씨 + 시간별/주간 예보, 대시보드 위젯
- **대시보드 위젯 설정** - 뉴스/날씨 위젯 표시 토글 (`dashboard_config` JSONB)
- **LLM 그룹핑** - Ollama 기반 LLM 그룹핑 워커 (`grouping_jobs` 큐)
- **콘텐츠 모더레이션** - 필터 CRUD, 품질 검토 큐
- **사용자 관리** - 역할 변경, 계정 정지
- **시스템 모니터링** - 수집 로그/요약 작업/시스템 상태 통합 뷰
- **이미지 프록시** - 언론사 hotlink 방지 이미지 서버 사이드 우회
- **캐시 재검증 API** - Ollama 워커 요약 완료 후 Next.js 캐시 즉시 무효화

## 기술 스택

| 영역       | 기술                                                      |
| ---------- | --------------------------------------------------------- |
| 프레임워크 | Next.js 16 (App Router, Turbopack, cacheComponents: true) |
| UI         | React 19, Tailwind CSS 4, shadcn/ui (new-york), Radix UI  |
| 백엔드     | Supabase (PostgreSQL, Auth, RLS, RPC, Realtime)           |
| AI 요약    | Ollama (qwen2.5:14b, 로컬 LLM)                            |
| 날씨       | OpenWeatherMap Free tier                                  |
| 코드 품질  | Prettier, ESLint, Husky + lint-staged, Playwright         |
| 배포       | Vercel (Cron 작업 포함)                                   |

## 아키텍처

```
[Vercel Cron 하루 2회 (KST 08:00, 20:00)]
  |
  v
[/api/news/collect]
  |-- RSS 파싱 (rss-parser)
  |-- 콘텐츠 필터링 (content-filter.ts, content_filters 테이블)
  |-- 중복 필터링 → DB INSERT → [news_articles]
  |-- 배치 그룹핑 RPC (batch_group_articles, pg_trgm 유사도 0.5)
  |-- 그룹핑 작업 등록 → [grouping_jobs]
  |-- 요약 작업 등록 → [summarize_jobs]
  |-- 캐시 무효화 (revalidateTag)

[Ollama PC 워커 (scripts/)]
  |-- Supabase Realtime + 30초 폴링
  |-- summarize_jobs: pending 감지 → Ollama 팩트 요약 → 한국어 검증 → DB 저장
  |-- grouping_jobs: pending 감지 → LLM 그룹핑 (llm-grouper.ts) → DB 저장
  |-- 배치 완료 후 POST /api/news/revalidate → Next.js 캐시 무효화

[Next.js 웹앱]
  |-- Supabase DB 조회 (is_valid=true 그룹만)
  |-- OpenWeatherMap API (lib/weather/api.ts, "use cache" 30분 캐시)
  |-- /api/image-proxy (언론사 hotlink 방지 이미지 우회)
  |-- proxy.ts (미들웨어: 세션 갱신 + 미인증/관리자 리다이렉트)
```

시스템은 세 부분으로 구성됩니다:

1. **Vercel 웹앱 + Cron** - Next.js App Router 기반. Vercel Cron이 하루 2회 RSS를 수집하고 그룹핑/요약 작업을 큐에 등록
2. **Supabase PostgreSQL** - 데이터 저장소이자 메시지 큐. `summarize_jobs`, `grouping_jobs` 테이블이 Vercel과 Ollama PC 사이의 작업 큐로 동작
3. **Ollama PC 워커** - 별도 PC에서 `qwen2.5:14b` 구동. 요약(서술형 마크다운) + LLM 그룹핑 두 가지 작업을 병렬 처리

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
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<supabase-service-role-key>
CRON_SECRET=<랜덤-시크릿>
WEATHER_API_KEY=<openweathermap-api-key>   # 선택, 미설정 시 날씨 위젯 숨김
```

> `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`는 Supabase 대시보드의 anon key와 동일합니다.

DB 마이그레이션을 적용합니다 (현재 35개):

```bash
npx supabase db push
```

### OAuth Provider 설정

Supabase 대시보드 → **Authentication** → **Providers**에서 설정:

- **Google**: [Google Cloud Console](https://console.cloud.google.com/)에서 OAuth 2.0 클라이언트 생성. Redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
- **Kakao**: [Kakao Developers](https://developers.kakao.com/)에서 앱 생성. Redirect URI 동일

```bash
npm run dev
```

> **개발 환경 로그인**: `/api/auth/dev-login` API로 테스트 계정 자동 생성 및 로그인 가능 (`.env.local`의 `TEST_USER_EMAIL`/`TEST_USER_PASSWORD` 사용).

### Ollama 워커 설정 (AI 요약 + LLM 그룹핑용)

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

# Next.js 캐시 즉시 무효화 (선택, 설정 시 요약 완료 후 자동 갱신)
REVALIDATE_URL=https://your-project.vercel.app
CRON_SECRET=<동일한-cron-secret>
```

```bash
ollama pull qwen2.5:14b
npm start
```

워커는 두 가지 작업을 독립적으로 병렬 처리합니다:

- **요약** (`summarize_jobs`): Ollama로 팩트 요약 생성 → 한국어 검증 → `fact_summary` 저장
- **LLM 그룹핑** (`grouping_jobs`): Ollama로 기사 제목 유사성 분석 → 그룹 클러스터링

## 개발 명령어

```bash
npm run dev             # 개발 서버 (localhost:3000)
npm run build           # 프로덕션 빌드 (Turbopack)
npm run lint            # ESLint
npm run lint:fix        # ESLint 자동 수정
npm run format          # Prettier 전체 포매팅
npm run format:check    # Prettier 포매팅 상태 확인
npm run type-check      # TypeScript 타입 검사
npx playwright test                              # E2E 테스트 실행
npx playwright test tests/news-search.spec.ts    # 특정 테스트 파일 실행
npx playwright test --ui                         # 테스트 UI 모드
npx supabase db push                             # DB 마이그레이션 적용 (원격)
```

## 프로젝트 구조

```
app/
  admin/                   # 관리자 페이지 (v1.1c~d)
    layout.tsx             #   isAdmin() 검증 + AdminSidebar 레이아웃
    page.tsx               #   관리자 대시보드 (통계, 차트)
    news/page.tsx          #   뉴스 관리 (소스/그룹/기사 탭)
    moderation/page.tsx    #   콘텐츠 모더레이션 (필터/품질 검토 탭)
    users/page.tsx         #   사용자 관리 (역할 변경, 계정 정지)
    monitoring/page.tsx    #   시스템 모니터링 (로그/작업/상태 탭)
  api/
    auth/dev-login/        # 개발용 로그인 API
    image-proxy/           # 외부 이미지 프록시 (hotlink 방지 우회)
    news/
      collect/             #   RSS 수집 API (Vercel Cron, maxDuration=60)
      bookmarks/           #   북마크 CRUD API
      revalidate/          #   캐시 무효화 API (Ollama 워커 호출용)
    user/preferences/      # 사용자 설정 API (선호 카테고리, 위젯 설정)
    admin/
      news/{sources,groups,articles}/  # 뉴스 관리 API
      moderation/{filters,quality}/    # 모더레이션 API
      users/[userId]/                  # 사용자 관리 API
      monitoring/{logs,jobs,status}/   # 모니터링 API
  auth/login/              # 소셜 로그인 페이지
  protected/               # 인증 필요 페이지
    page.tsx               #   대시보드 (최신 뉴스 + 날씨 위젯)
    news/
      page.tsx             #   뉴스 목록 (카테고리 탭 + 검색바 + 페이지네이션)
      [groupId]/page.tsx   #   뉴스 상세 (팩트 요약 + 관련 기사 + 북마크/공유)
    settings/page.tsx      #   사용자 설정 (프로필, 선호 카테고리, 위젯 토글)
    weather/page.tsx        #   날씨 상세 (시간별/주간 예보)
components/
  admin/                   # 관리자 UI (모두 Client Component)
  layout/                  # 공통 레이아웃 (header, mobile-nav, footer)
  news/                    # 뉴스 UI (Server/Client 분리)
  settings/                # 사용자 설정 컴포넌트
  weather/                 # 날씨 위젯 + 예보 컴포넌트
  ui/                      # shadcn/ui 컴포넌트
lib/
  admin/queries.ts         # 관리자 데이터 쿼리 (createAdminClient 사용)
  auth/admin.ts            # isAdmin(), requireAdmin(), logAdminAction()
  news/                    # 뉴스 파이프라인 모듈 + 프론트엔드 쿼리
  supabase/                # 클라이언트 (server, client, proxy, admin, env)
  weather/                 # OpenWeatherMap API 모듈 ("use cache" 30분 캐시)
  utils/                   # 유틸리티 (format-time, parse-facts)
scripts/                   # Ollama PC 워커 (독립 패키지)
  worker.ts                #   메인 워커 (요약 + LLM 그룹핑 병렬 처리)
  summarizer.ts            #   팩트 추출 + 한국어 검증
  llm-grouper.ts           #   LLM 기반 기사 그룹핑
supabase/migrations/       # DB 마이그레이션 SQL (35개)
docs/
  PRD.md                   # 제품 요구사항 (v3.0, 2026-02-18)
  ROADMAP.md               # 개발 로드맵 (v1.1d 완료, v1.2 진행 중)
  ISSUE.md                 # 알려진 이슈 및 버그 추적
  complete/                # 완료된 로드맵 아카이브
tests/                     # E2E 테스트 (Playwright)
```

## 데이터베이스 스키마

| 테이블                | 설명                                                               |
| --------------------- | ------------------------------------------------------------------ |
| `news_sources`        | RSS 피드 소스 (언론사명, 피드 URL, 카테고리)                       |
| `news_article_groups` | 유사 기사 그룹 (대표 기사, 팩트 요약, 카테고리, `is_valid` 플래그) |
| `news_articles`       | 개별 기사 (제목, URL, 소스, 그룹 연결, `is_deleted` soft delete)   |
| `news_fetch_logs`     | 수집 로그 (소스별 성공/실패, 수집 개수, `filtered_count`)          |
| `summarize_jobs`      | AI 요약 작업 큐 (pending/processing/completed/failed), Realtime    |
| `grouping_jobs`       | LLM 그룹핑 작업 큐 (`article_ids` 배열, 동일 상태 흐름)            |
| `content_filters`     | 콘텐츠 필터링 규칙 (블랙리스트/화이트리스트 키워드)                |
| `user_preferences`    | 사용자 설정 (선호 카테고리, 대시보드 위젯 설정, weather_location)  |
| `user_bookmarks`      | 사용자 북마크 (뉴스 그룹 ID, 최대 100개 제한)                      |
| `admin_audit_logs`    | 관리자 행위 감사 로그 (action, target_type, target_id, details)    |

### RPC 함수 (service_role 전용)

| 함수                          | 설명                                              |
| ----------------------------- | ------------------------------------------------- |
| `find_similar_group`          | pg_trgm 유사도 기반 그룹 검색                     |
| `increment_article_count`     | 그룹 기사 수 갱신                                 |
| `cleanup_old_records`         | 오래된 로그/작업 정리 (90일 로그, 30일 완료 작업) |
| `enqueue_summarize_jobs`      | 요약 작업 일괄 등록                               |
| `get_top_articles_for_groups` | 그룹별 상위 N개 기사 조회 (윈도우 함수)           |
| `batch_group_articles`        | 배치 그룹핑 (유사도 임계값 0.5, 72시간 범위)      |
| `get_user_bookmarks`          | 북마크 목록 조회 (JOIN으로 뉴스 그룹 정보 포함)   |
| `search_news_groups`          | 뉴스 검색 (pg_trgm 유사도 기반, 제목 및 요약)     |

## 개발 진행 상황

### v1.0 (MVP) - 완료 (2026-02-16)

- [x] Phase 0~5 - 기반 정비, DB 스키마, Ollama 워커, 뉴스 UI, 페이지네이션, 배포

### v1.1a ~ v1.1d - 완료 (2026-02-18)

- [x] v1.1a - 뉴스 UX 개선 (상세 페이지, AI 품질 관리, 콘텐츠 필터링)
- [x] v1.1b - 사용자 경험 (소셜 로그인, 검색, 북마크, 공유, 설정)
- [x] v1.1c - 관리자 시스템 핵심 (역할 제어, 대시보드, 뉴스 관리)
- [x] v1.1d - 날씨 위젯, LLM 그룹핑, 모더레이션, 사용자/모니터링 관리, 이미지 프록시, 캐시 재검증 API

### v1.2 - 개발 중

- [ ] v1.2a - 뉴스 서술형 요약 전환 + 날씨 위치 설정 개선 (Geolocation)
- [ ] v1.2b - 빠른 메모 위젯 + 선호 카테고리 실제 활용
- [ ] v1.2c - SEO/메타데이터, 에러 바운더리 보완, 성능 최적화
- [ ] v1.2d - 이메일 뉴스 다이제스트 (Resend), 뉴스 트렌드 시각화, Naver 로그인 PoC

자세한 계획은 [ROADMAP.md](docs/ROADMAP.md) 참고.

## 문서

- [PRD](docs/PRD.md) - 제품 요구사항 문서 (v3.0, 2026-02-18)
- [ROADMAP](docs/ROADMAP.md) - 개발 로드맵
- [CLAUDE.md](CLAUDE.md) - Claude Code 작업 가이드
- [완료된 로드맵](docs/complete/) - v1.0~v1.1d 아카이브

## 라이선스

Private

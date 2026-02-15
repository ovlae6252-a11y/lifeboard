# Lifeboard (라이프보드)

인생의 모든 데이터를 한눈에 볼 수 있는 통합 대시보드 웹 애플리케이션.

MVP 단계에서는 한국 주요 언론사 RSS 뉴스 수집, AI 기반 팩트 요약, 카테고리별 뉴스 탐색 기능에 집중합니다.

## 주요 기능

- **RSS 뉴스 자동 수집** - 한국 주요 언론사 13개 피드에서 뉴스를 자동 수집 (하루 2회)
- **유사 기사 그룹핑** - 트라이그램 유사도 기반으로 같은 사안의 기사를 자동 그룹화
- **AI 팩트 요약** - Ollama(qwen2.5:14b)를 활용하여 핵심 팩트를 불릿 포인트로 요약
- **카테고리별 탐색** - 정치, 경제, 사회, 생활/문화, IT/과학, 세계 6개 카테고리 필터
- **반응형 대시보드** - 데스크톱/모바일 반응형 레이아웃, 다크모드 지원
- **이메일 인증** - Supabase Auth 기반 이메일 OTP 회원가입/로그인

## 기술 스택

| 영역       | 기술                                                     |
| ---------- | -------------------------------------------------------- |
| 프레임워크 | Next.js 16 (App Router, Turbopack, Cache Components)     |
| UI         | React 19, Tailwind CSS 3, shadcn/ui (new-york), Radix UI |
| 백엔드     | Supabase (PostgreSQL, Auth, RLS, RPC, Realtime)          |
| AI 요약    | Ollama (qwen2.5:14b, 로컬 LLM)                           |
| 배포       | Vercel (Cron 작업 포함)                                  |

## 아키텍처

```
[Vercel Cron 하루 2회] → [/api/news/collect] → [Supabase DB]
                                                      │
                                           [summarize_jobs 큐]
                                                      │
                                           [Ollama PC 워커] → [팩트 요약 저장]
                                                      │
[Next.js 웹앱] ←── 조회 ── [Supabase DB] (요약 완료된 뉴스 표시)
```

시스템은 세 부분으로 구성됩니다:

1. **Vercel 웹앱 + Cron** - Next.js App Router 기반 웹 애플리케이션. Vercel Cron이 하루 2회(KST 8시, 20시) RSS 수집 API를 호출
2. **Supabase PostgreSQL** - 데이터 저장소이자 메시지 큐 역할. `summarize_jobs` 테이블이 Vercel과 Ollama PC 사이의 작업 큐로 동작
3. **Ollama PC 워커** - 별도 PC에서 `qwen2.5:14b` 모델을 구동. Supabase Realtime/폴링으로 pending 작업을 감지하여 팩트 요약을 자동 처리

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

개발 서버를 실행합니다:

```bash
npm run dev
```

[localhost:3000](http://localhost:3000/)에서 확인합니다.

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

워커는 Supabase Realtime 구독 + 30초 폴링으로 pending 작업을 자동 감지하여 처리합니다.

## 개발 명령어

```bash
npm run dev          # 개발 서버 (localhost:3000)
npm run build        # 프로덕션 빌드 (Turbopack)
npm run lint         # ESLint
npx supabase db push # DB 마이그레이션 적용 (원격 Supabase)
```

## 프로젝트 구조

```
app/
  api/news/collect/   # RSS 수집 API (Vercel Cron + 수동 호출)
  auth/               # 인증 플로우 (로그인, 회원가입, 비밀번호 재설정)
  protected/          # 인증 필요 페이지 (대시보드, 뉴스)
components/
  layout/             # 공통 레이아웃 (헤더, 모바일 네비게이션, 푸터)
  news/               # 뉴스 UI 컴포넌트 (카드, 탭, 목록, 스켈레톤)
  ui/                 # shadcn/ui 컴포넌트
lib/
  news/               # 뉴스 파이프라인 (RSS 파싱, 그룹핑, 요약 큐, 프론트엔드 쿼리)
  supabase/           # Supabase 클라이언트 (server, client, proxy, admin, env)
  utils/              # 유틸리티 (상대 시간 포맷, 팩트 파싱)
scripts/              # Ollama PC 워커 (독립 패키지)
supabase/
  migrations/         # DB 마이그레이션 SQL 파일 (11개)
docs/
  PRD.md              # 제품 요구사항
  ROADMAP.md          # 개발 로드맵
```

## 데이터베이스 스키마

| 테이블                | 설명                                                        |
| --------------------- | ----------------------------------------------------------- |
| `news_sources`        | RSS 피드 소스 (언론사명, 피드 URL, 카테고리)                |
| `news_article_groups` | 유사 기사 그룹 (대표 기사, 팩트 요약, 카테고리)             |
| `news_articles`       | 개별 기사 (제목, URL, 소스, 그룹 연결)                      |
| `news_fetch_logs`     | 수집 로그 (소스별 성공/실패, 수집 개수)                     |
| `summarize_jobs`      | AI 요약 작업 큐 (상태: pending/processing/completed/failed) |

## 개발 진행 상황

- [x] **Phase 0** - 프로젝트 기반 정비, 브랜딩, 공통 레이아웃
- [x] **Phase 1** - DB 스키마 + RSS 수집 파이프라인
- [x] **Phase 2** - Ollama PC 워커
- [x] **Phase 3** - 프론트엔드 뉴스 표시
- [x] **Phase 4** - 페이지네이션 + UX 개선
- [ ] **Phase 5** - 통합 테스트 + 배포 준비

## 문서

- [PRD](docs/PRD.md) - 제품 요구사항 문서
- [ROADMAP](docs/ROADMAP.md) - 개발 로드맵 (Phase 0~5)

## 라이선스

Private

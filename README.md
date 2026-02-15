# Lifeboard (라이프보드)

인생의 모든 데이터를 한눈에 볼 수 있는 통합 대시보드 웹 애플리케이션.

MVP 단계에서는 한국 주요 언론사 RSS 뉴스 수집, AI 기반 팩트 요약, 카테고리별 뉴스 탐색 기능에 집중합니다.

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router, Turbopack, Cache Components) |
| UI | React 19, Tailwind CSS 3, shadcn/ui (new-york) |
| 백엔드 | Supabase (PostgreSQL, Auth, RLS, RPC) |
| AI 요약 | Ollama (qwen2.5:14b, 로컬 LLM) |
| 배포 | Vercel (Cron 작업 포함) |

## 아키텍처

```
[Vercel Cron 매시 정각] → [/api/news/collect] → [Supabase DB]
                                                      │
                                           [summarize_jobs 큐]
                                                      │
                                           [Ollama PC 워커] → [팩트 요약 저장]
                                                      │
[Next.js 웹앱] ←── 조회 ── [Supabase DB] (요약 완료된 뉴스 표시)
```

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

## 개발 명령어

```bash
npm run dev          # 개발 서버 (localhost:3000)
npm run build        # 프로덕션 빌드 (Turbopack)
npm run lint         # ESLint
npx supabase db push # DB 마이그레이션 적용
```

## 프로젝트 구조

```
app/
  api/news/collect/   # RSS 수집 API (Vercel Cron + 수동 호출)
  auth/               # 인증 플로우 (로그인, 회원가입, 비밀번호 재설정)
  protected/          # 인증 필요 페이지 (대시보드, 뉴스)
components/
  layout/             # 공통 레이아웃 (헤더, 모바일 네비게이션, 푸터)
  ui/                 # shadcn/ui 컴포넌트
lib/
  news/               # 뉴스 수집 파이프라인 (RSS 파싱, 그룹핑, 요약 큐)
  supabase/           # Supabase 클라이언트 (server, client, proxy, admin, env)
supabase/
  migrations/         # DB 마이그레이션 SQL 파일
docs/
  PRD.md              # 제품 요구사항
  ROADMAP.md          # 개발 로드맵
```

## 문서

- [PRD](docs/PRD.md) - 제품 요구사항 문서
- [ROADMAP](docs/ROADMAP.md) - 개발 로드맵 (Phase 0~5)

## 라이선스

Private

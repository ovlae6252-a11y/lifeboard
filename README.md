# Lifeboard (라이프보드)

인생의 모든 데이터를 한눈에 볼 수 있는 통합 대시보드 웹 애플리케이션.

MVP 단계에서는 한국 주요 언론사 RSS 뉴스 수집, AI 기반 팩트 요약, 카테고리별 뉴스 탐색 기능에 집중합니다.

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS 3, shadcn/ui |
| 백엔드 | Supabase (PostgreSQL, Auth, RLS) |
| AI 요약 | Ollama (qwen2.5:14b, 로컬 LLM) |
| 배포 | Vercel |

## 시작하기

### 사전 요구사항

- Node.js 20+
- [Supabase 프로젝트](https://database.new)

### 설치 및 실행

```bash
npm install
```

`.env.example`을 참고하여 `.env.local` 파일을 생성합니다:

```env
NEXT_PUBLIC_SUPABASE_URL=[Supabase 프로젝트 URL]
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[Supabase Publishable Key]
```

> `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`는 Supabase 대시보드의 anon key와 동일합니다.
> [API 설정](https://supabase.com/dashboard/project/_?showConnect=true)에서 확인할 수 있습니다.

```bash
npm run dev
```

[localhost:3000](http://localhost:3000/)에서 확인합니다.

## 개발 명령어

```bash
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
npm run lint     # ESLint
```

## 프로젝트 구조

```
app/
  auth/           # 인증 플로우 (로그인, 회원가입, 비밀번호 재설정)
  protected/      # 인증 필요 페이지 (대시보드, 뉴스)
components/
  layout/         # 공통 레이아웃 (헤더, 모바일 네비게이션, 푸터)
  ui/             # shadcn/ui 컴포넌트
lib/
  supabase/       # Supabase 클라이언트 (server, client, proxy, env)
docs/
  PRD.md          # 제품 요구사항
  ROADMAP.md      # 개발 로드맵
```

## 문서

- [PRD](docs/PRD.md) - 제품 요구사항 문서
- [ROADMAP](docs/ROADMAP.md) - 개발 로드맵 (Phase 0~5)

## 라이선스

Private

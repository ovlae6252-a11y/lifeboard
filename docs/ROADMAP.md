# Lifeboard (라이프보드) - 개발 로드맵

## 개요

라이프보드는 인생의 모든 데이터를 한눈에 볼 수 있는 통합 대시보드 웹 애플리케이션이다. MVP(v1.0, Phase 0~5)가 2026-02-16에 완료되어 프로덕션 운영 중이다 ([ROADMAP v1.0 아카이브](./complete/ROADMAP_v1.0.md)).

이 로드맵은 `docs/PRD.md`(v2.4, 2026-02-16)를 기반으로 작성되었으며, v1.1 구현에 집중한다. v1.1은 뉴스 UX 개선, 소셜 로그인, 관리자 시스템 구축을 목표로 하며 v1.1a~d 4단계로 점진적 배포한다. v1.2 이후 버전은 v1.1 완료 후 별도 로드맵으로 작성 예정이다.

## 기술 스택

| 영역                  | 기술                     | 버전/비고                                               |
| --------------------- | ------------------------ | ------------------------------------------------------- |
| 프론트엔드 프레임워크 | Next.js (App Router)     | 16 (Turbopack, cacheComponents: true)                   |
| UI 라이브러리         | React                    | 19                                                      |
| 언어                  | TypeScript               | 5 (strict)                                              |
| 스타일링              | Tailwind CSS             | 4 (CSS 변수 기반 테마, OKLCH)                           |
| UI 컴포넌트           | shadcn/ui                | new-york 스타일                                         |
| 아이콘                | Lucide React             | -                                                       |
| 다크모드              | next-themes              | class 방식                                              |
| 폰트                  | next/font/google         | Libre Baskerville + Noto Sans KR + Lora + IBM Plex Mono |
| BaaS                  | Supabase (@supabase/ssr) | 인증, DB, RLS, Realtime                                 |
| 데이터베이스          | PostgreSQL               | Supabase 호스팅, pg_trgm                                |
| AI                    | Ollama (qwen2.5:14b)     | 로컬 LLM, 별도 PC 상주 워커                             |
| RSS 파싱              | rss-parser               | npm 패키지                                              |
| 배포                  | Vercel                   | Cron 작업, Speed Insights                               |
| 코드 품질             | ESLint + Prettier        | Husky + lint-staged (pre-commit)                        |
| 차트                  | shadcn/ui charts         | Recharts 기반 (v1.1c 관리자 대시보드)                   |

## 아키텍처 개요

### 현재 아키텍처 (v1.0)

```
[Vercel Cron 하루 2회 (KST 08:00, 20:00)]
  |
  v
[/api/news/collect] -- RSS 파싱 --> [Supabase DB]
  |                                      |
  |-- 배치 그룹핑 (RPC) --------------->|
  |-- 요약 작업 등록 (RPC) ------------>|-- summarize_jobs (큐)
  |-- 캐시 무효화 (updateTag) -------->|        |
                                        |        v
                                        |  [Ollama PC 워커]
                                        |    Realtime + 30s 폴링
                                        |    qwen2.5:14b 팩트 추출
                                        |        |
                                        |<-------| fact_summary 저장
                                        |
[Next.js 웹앱] <-- use cache + admin 클라이언트 -- [Supabase DB]
```

### v1.1 아키텍처 확장

- **소셜 로그인 흐름** (v1.1b): Supabase Auth + Google/Kakao/Apple OAuth 프로바이더
- **콘텐츠 필터링** (v1.1a): RSS 수집 파이프라인에 키워드 블랙리스트/화이트리스트 필터 추가
- **관리자 시스템** (v1.1c~d): `/admin/*` 라우트, 관리자 전용 API Route, 관리자 사이드바 레이아웃
- **날씨 데이터** (v1.1d): OpenWeatherMap API -> `use cache` 캐싱 -> 대시보드 위젯

---

## 개발 단계

### v1.1a: 뉴스 UX 개선 (예상 3~5일)

**목표:** 사용자 피드백을 반영하여 뉴스 시스템의 UI/UX를 개선한다. 카드 간소화, 상세 페이지 분리, AI 요약 품질 향상, 그룹핑 개선, 콘텐츠 필터링을 구현한다.
**완료 기준:** 뉴스 목록에서 대표이미지 + 제목만 표시되고, 클릭 시 상세 페이지에서 통일된 팩트 요약을 확인할 수 있다. AI 요약 품질이 검증되며, 불필요 기사가 필터링된다.

#### 마일스톤 1a.1: AI 요약 품질 관리 + 그룹핑 개선 + 콘텐츠 필터링 (F111, F112, F113)

> 백엔드/파이프라인 변경을 먼저 수행하여, 프론트엔드 작업 시 데이터 품질이 보장되도록 한다.

- [ ] 태스크 1a.1.1: `news_article_groups` 테이블에 `is_valid` 컬럼 추가 (F111)
  - 상세: `is_valid BOOLEAN DEFAULT true` 컬럼 추가. `WHERE is_valid = true` partial index 생성. 기존 데이터는 기본값으로 모두 valid.
  - 관련 파일: `supabase/migrations/[timestamp]_add_is_valid_column.sql`

- [ ] 태스크 1a.1.2: `news_fetch_logs` 테이블에 `filtered_count` 컬럼 추가 (F113)
  - 상세: `filtered_count INTEGER DEFAULT 0` 컬럼 추가. 콘텐츠 필터링된 기사 수 기록용.
  - 관련 파일: `supabase/migrations/[timestamp]_add_filtered_count_column.sql`

- [ ] 태스크 1a.1.3: `content_filters` 테이블 생성 (F113)
  - 상세: `id UUID PK`, `filter_type TEXT NOT NULL` ('blacklist' | 'whitelist'), `keywords TEXT[] NOT NULL`, `is_active BOOLEAN DEFAULT true`, `created_at`, `updated_at`. RLS: 모든 인증 사용자 읽기 전용, service_role만 수정. 초기 시드 데이터로 블랙리스트/화이트리스트 키워드 INSERT.
  - 관련 파일: `supabase/migrations/[timestamp]_create_content_filters.sql`

- [ ] 태스크 1a.1.4: `news_articles` 테이블에 `is_deleted` 컬럼 추가 (F122 선행)
  - 상세: `is_deleted BOOLEAN DEFAULT false` 컬럼 추가. v1.1c 관리자 기사 관리에서 soft delete용. 프론트엔드 쿼리에서 `WHERE is_deleted = false` 필터 추가.
  - 관련 파일: `supabase/migrations/[timestamp]_add_is_deleted_column.sql`

- [ ] 태스크 1a.1.5: `database.types.ts` 재생성
  - 상세: 위 컬럼 추가 후 `npx supabase gen types typescript --project-id <project-id> > lib/supabase/database.types.ts` 실행하여 타입 파일 갱신.
  - 관련 파일: `lib/supabase/database.types.ts`

- [ ] 태스크 1a.1.6: Ollama 프롬프트 한국어 전용 강화 (F111)
  - 상세: `scripts/summarizer.ts`의 팩트 추출 프롬프트에 "**CRITICAL: 반드시 한국어로만 작성하세요. 절대로 다른 언어(영어, 중국어, 일본어 등)를 섞지 마세요.**" 문구 추가. 응답 시작/끝에도 한국어 강조 지시문 배치.
  - 관련 파일: `scripts/summarizer.ts`

- [ ] 태스크 1a.1.7: 한국어 검증 함수 구현 및 워커에 적용 (F111)
  - 상세: `scripts/summarizer.ts`에 `validateKoreanContent(text: string): boolean` 함수 추가. 한글 문자 비율 70% 미만이면 false 반환. 요약 완료 후 검증 실패 시 `news_article_groups.is_valid = false` 업데이트. 실패 사유를 `summarize_jobs.error_message`에 기록.
  - 관련 파일: `scripts/summarizer.ts`

- [ ] 태스크 1a.1.8: `batch_group_articles` RPC 기본 파라미터 변경 (F112)
  - 상세: `p_similarity_threshold` 기본값 0.6 -> 0.5, `p_hours_range` 기본값 48 -> 72. 기존 함수 전체를 `CREATE OR REPLACE`로 재생성. 함수 본문은 `20260216000006_add_batch_group_articles_rpc.sql` 참고하여 동일하게 유지.
  - 관련 파일: `supabase/migrations/[timestamp]_update_grouping_threshold.sql`

- [ ] 태스크 1a.1.9: 추가 RSS 소스 시드 데이터 등록 (F112)
  - 상세: 중앙일보, 조선일보, 서울신문 등 추가하여 12개 -> 20개+ 소스로 확대. 카테고리별 균형 배분. `news_sources` INSERT 마이그레이션.
  - 관련 파일: `supabase/migrations/[timestamp]_seed_additional_news_sources.sql`

- [ ] 태스크 1a.1.10: 콘텐츠 필터링 모듈 구현 (F113)
  - 상세: `lib/news/content-filter.ts` 신규. `shouldFilterArticle(title: string): boolean` 함수. `content_filters` 테이블에서 활성 필터 조회 (캐싱 권장). 블랙리스트 키워드 포함 + 화이트리스트 미포함 시 true 반환.
  - 관련 파일: `lib/news/content-filter.ts`

- [ ] 태스크 1a.1.11: RSS 수집 API에 콘텐츠 필터링 적용 (F113)
  - 상세: `app/api/news/collect/route.ts`에서 DB INSERT 전에 `shouldFilterArticle()` 호출. 필터링된 기사 수를 `news_fetch_logs.filtered_count`에 기록. 수집 결과 JSON에 `filteredCount` 포함.
  - 관련 파일: `app/api/news/collect/route.ts`, `lib/news/fetch-logger.ts`

- [ ] 태스크 1a.1.12: 프론트엔드 뉴스 쿼리에 `is_valid` 필터 추가 (F111)
  - 상세: `lib/news/queries.ts`의 `getNewsGroups()`, `getLatestNewsGroups()` 쿼리에 `.eq("is_valid", true)` 조건 추가. `is_deleted` 필터도 함께 적용 (`.eq("is_deleted", false)` - 대표 기사 조인 시).
  - 관련 파일: `lib/news/queries.ts`

- [ ] 태스크 1a.1.13: Playwright MCP 테스트 - 백엔드 파이프라인 변경 검증
  - 사전 조건: 태스크 1a.1.1 ~ 1a.1.12 완료
  - 검증 항목:
    1. `browser_navigate`로 `/protected/news` 접근 -> 페이지 정상 로드
    2. `browser_snapshot`으로 `is_valid = false`인 뉴스 그룹이 목록에 표시되지 않는지 확인
    3. `browser_console_messages`로 에러 없음 확인
  - 결과: 스크린샷 저장 (`browser_take_screenshot`)

#### 마일스톤 1a.2: 뉴스 카드 UI 간소화 (F108)

- [ ] 태스크 1a.2.1: 카테고리별 기본 이미지 에셋 준비
  - 상세: `public/images/categories/` 디렉토리 생성. 7개 카테고리(politics, economy, society, culture, science, world, default)에 대한 플레이스홀더 이미지 추가. 16:9 비율, 최적화된 WebP 또는 SVG.
  - 관련 파일: `public/images/categories/*.{webp,svg}`

- [ ] 태스크 1a.2.2: 이미지 폴백 유틸리티 함수 구현
  - 상세: `lib/utils/news-image.ts` 신규. `getNewsImageUrl(imageUrl: string | null, category: string): string` 함수. 우선순위: (1) RSS 제공 image_url -> (2) 카테고리별 기본 이미지 -> (3) 기본 플레이스홀더. `next/image` 리모트 도메인 설정 필요 시 `next.config.ts` 업데이트.
  - 관련 파일: `lib/utils/news-image.ts`, `next.config.ts`

- [ ] 태스크 1a.2.3: `news-group-card.tsx` 리팩토링 - 간소화된 카드 UI (F108)
  - 상세: 기존 카드(팩트 요약 + 관련 기사 링크)를 **대표이미지 + 제목 + 카테고리 배지 + 기사 수 + 상대시간**으로 간소화. 카드 전체를 `Link` 컴포넌트로 감싸서 `/protected/news/[groupId]`로 이동. 좌측 썸네일(1:1 또는 16:9) + 우측 메타정보 레이아웃. 모바일에서는 상단 이미지 + 하단 텍스트. `next/image` 활용.
  - 관련 파일: `components/news/news-group-card.tsx`

- [ ] 태스크 1a.2.4: `news-dashboard-section.tsx` 카드 UI 동기화 (F108)
  - 상세: 대시보드 뉴스 섹션도 간소화된 카드 UI 적용. 카드 클릭 시 상세 페이지로 이동.
  - 관련 파일: `components/news/news-dashboard-section.tsx`

- [ ] 태스크 1a.2.5: Playwright MCP 테스트 - 간소화된 뉴스 카드 UI
  - 사전 조건: 태스크 1a.2.3, 1a.2.4 완료
  - 검증 항목:
    1. `browser_navigate`로 `/protected/news` 접근 -> 간소화된 카드 렌더링 확인
    2. `browser_snapshot`으로 카드에 제목, 카테고리 배지, 기사 수 표시 확인 (팩트 요약은 표시 안 됨)
    3. `browser_click`으로 카드 클릭 -> `/protected/news/[groupId]` URL 이동 확인
    4. `browser_navigate`로 `/protected` (대시보드) 접근 -> 뉴스 위젯도 동일한 간소화 카드 확인
    5. `browser_console_messages`로 에러 없음 확인
  - 결과: 뉴스 목록/대시보드 스크린샷 저장

#### 마일스톤 1a.3: 뉴스 상세 페이지 + 통일된 팩트 요약 폼 (F109, F110)

- [ ] 태스크 1a.3.1: 뉴스 상세 데이터 쿼리 함수 구현
  - 상세: `lib/news/queries.ts`에 `getNewsGroupDetail(groupId: string)` 추가. 그룹 정보(대표 기사 제목, 카테고리, article_count, fact_summary, created_at) + 대표 기사 조인. `getRelatedArticles(groupId: string)` 추가. 그룹 내 모든 기사 목록 (제목, 소스명, original_url, published_at), 발행시간 최신순 정렬.
  - 관련 파일: `lib/news/queries.ts`

- [ ] 태스크 1a.3.2: 통일된 팩트 요약 카드 컴포넌트 구현 (F110)
  - 상세: `components/news/fact-summary-card.tsx` 신규. shadcn/ui `Card` 기반. 좌측 "팩트 체크" 아이콘(lucide `CheckCircle` 또는 `ClipboardCheck`), 우측 불릿 포인트 목록. 제목: font-semibold text-lg, 불릿: text-base leading-relaxed. 커스텀 불릿 (체크 아이콘). 빈 상태: "AI 팩트 요약 생성 중입니다..." 스켈레톤.
  - 관련 파일: `components/news/fact-summary-card.tsx`

- [ ] 태스크 1a.3.3: 관련 기사 목록 컴포넌트 구현
  - 상세: `components/news/related-articles-list.tsx` 신규. 기사별 제목 + 언론사명(소스) + 발행시간(상대시간) + 외부 링크 아이콘. 클릭 시 `original_url`로 새 탭 열기. 반응형 레이아웃.
  - 관련 파일: `components/news/related-articles-list.tsx`

- [ ] 태스크 1a.3.4: 뉴스 상세 레이아웃 컴포넌트 구현 (F109)
  - 상세: `components/news/news-detail.tsx` 신규. 상단: 대표 기사 제목 + 카테고리 배지 + 기사 수 + 생성일시. 중단: `FactSummaryCard` 컴포넌트. 하단: `RelatedArticlesList` 컴포넌트. "뒤로가기" 버튼 (뉴스 목록으로). Server Component.
  - 관련 파일: `components/news/news-detail.tsx`

- [ ] 태스크 1a.3.5: 뉴스 상세 페이지 구현 (`/protected/news/[groupId]`)
  - 상세: `app/protected/news/[groupId]/page.tsx` 신규. Server Component. `params.groupId`로 `getNewsGroupDetail()` + `getRelatedArticles()` 호출. `NewsDetail` 컴포넌트에 데이터 전달. 존재하지 않는 groupId일 경우 `notFound()` 호출. `Suspense` fallback 적용. `app/protected/news/[groupId]/loading.tsx` 스켈레톤 추가.
  - 관련 파일: `app/protected/news/[groupId]/page.tsx`, `app/protected/news/[groupId]/loading.tsx`

- [ ] 태스크 1a.3.6: Playwright MCP 테스트 - 뉴스 상세 페이지 + 팩트 요약 폼
  - 사전 조건: 태스크 1a.3.5 완료, DB에 요약된 뉴스 그룹 존재
  - 검증 항목:
    1. `browser_navigate`로 `/protected/news` 접근 -> 카드 클릭 -> 상세 페이지 이동
    2. `browser_snapshot`으로 상세 페이지에 대표 기사 제목, 카테고리, 기사 수, 생성일시 존재 확인
    3. `browser_snapshot`으로 팩트 요약 카드 렌더링 확인 (불릿 포인트, 체크 아이콘)
    4. `browser_snapshot`으로 관련 기사 목록 (제목, 언론사, 발행시간) 존재 확인
    5. `browser_click`으로 관련 기사 링크 클릭 -> 외부 사이트 새 탭 열기 확인
    6. `browser_console_messages`로 에러 없음 확인
  - 결과: 상세 페이지 스크린샷 저장

---

### v1.1b: 소셜 로그인 + 검색/북마크/설정 (예상 5~7일)

**목표:** 인증 시스템을 소셜 로그인(Google, Kakao, Apple)으로 전환하고, 뉴스 검색, 북마크, 사용자 설정 페이지, 뉴스 공유 기능을 구현한다.
**완료 기준:** 사용자가 소셜 계정으로 로그인하고, 뉴스를 검색/북마크/공유하며, 설정 페이지에서 프로필과 선호 카테고리를 관리할 수 있다.

#### 마일스톤 1b.1: 소셜 로그인 (F100)

> 소셜 로그인 전환은 다른 사용자별 기능(북마크 F102, 설정 F103)의 선행 조건이다.

- [ ] 태스크 1b.1.1: Supabase 대시보드에 OAuth 프로바이더 설정
  - 상세: Supabase Dashboard > Authentication > Providers에서 Google, Kakao, Apple 프로바이더 활성화. 각 프로바이더별 Client ID/Secret 입력. Redirect URL(`https://<project-ref>.supabase.co/auth/v1/callback`) 확인 및 각 OAuth 콘솔에 등록.
  - 관련 파일: 없음 (Supabase 대시보드 설정)

- [ ] 태스크 1b.1.2: OAuth 콜백 Route Handler 구현 (`/auth/callback`)
  - 상세: `app/auth/callback/route.ts` 신규. GET 핸들러. URL의 `code` 파라미터로 `supabase.auth.exchangeCodeForSession()` 호출. 성공 시 `/protected`로 리다이렉트. 실패 시 `/auth/error`로 리다이렉트 (에러 메시지 포함). Open Redirect 방지를 위해 `next` 파라미터는 상대 경로만 허용.
  - 관련 파일: `app/auth/callback/route.ts`

- [ ] 태스크 1b.1.3: 소셜 로그인 버튼 컴포넌트 구현
  - 상세: `components/social-login-buttons.tsx` 신규. Client Component. Google, Kakao, Apple 로그인 버튼 3개. 각 프로바이더 공식 브랜드 가이드라인 준수 (색상, 로고, 텍스트). `supabase.auth.signInWithOAuth({ provider, options: { redirectTo: '/auth/callback' } })` 호출. 로딩 상태 표시.
  - 관련 파일: `components/social-login-buttons.tsx`

- [ ] 태스크 1b.1.4: 로그인 페이지 변경 (`/auth/login`)
  - 상세: `app/auth/login/page.tsx` 수정. 이메일/비밀번호 폼 제거, `SocialLoginButtons` 컴포넌트만 표시. 중앙 정렬 카드 내 Lifeboard 로고 + "소셜 계정으로 로그인" 안내 + 버튼 3개 세로 배치. 에러 메시지 표시 (URL 파라미터 기반).
  - 관련 파일: `app/auth/login/page.tsx`

- [ ] 태스크 1b.1.5: `proxy.ts`에 `/auth/callback` 경로 예외 추가
  - 상세: `lib/supabase/proxy.ts`의 미인증 리다이렉트 예외 경로에 `/auth/callback` 추가. 기존 `/auth/*` 패턴에 이미 포함될 수 있으나 명시적으로 확인.
  - 관련 파일: `lib/supabase/proxy.ts`

- [ ] 태스크 1b.1.6: `auth-button.tsx` 소셜 프로필 표시로 변경
  - 상세: `components/auth-button.tsx` 수정. 이메일 대신 `raw_user_meta_data`에서 사용자 이름 표시. 프로필 이미지(아바타) 표시 (Google/Kakao 제공 시). 프로필 이미지 없는 경우 이니셜 아바타 fallback.
  - 관련 파일: `components/auth-button.tsx`

- [ ] 태스크 1b.1.7: 홈 페이지 CTA 버튼 업데이트
  - 상세: `app/page.tsx`에서 회원가입 버튼 제거. "시작하기" 또는 "로그인" 버튼으로 통합하여 `/auth/login`으로 이동.
  - 관련 파일: `app/page.tsx`

- [ ] 태스크 1b.1.8: 이메일/비밀번호 관련 페이지 및 컴포넌트 제거
  - 상세: 제거 대상 페이지: `app/auth/sign-up/`, `app/auth/forgot-password/`, `app/auth/update-password/`, `app/auth/sign-up-success/`, `app/auth/confirm/`. 제거 대상 컴포넌트: `components/login-form.tsx`, `components/sign-up-form.tsx`, `components/forgot-password-form.tsx`, `components/update-password-form.tsx`. 다른 파일에서 import 참조 정리.
  - 관련 파일: 위 파일들 전체 삭제

- [ ] 태스크 1b.1.9: E2E 테스트 인증 방식 전환
  - 상세: 기존 이메일/비밀번호 테스트 계정 대신 Supabase `auth.admin.createUser()` + 직접 세션 주입 방식으로 전환. 환경변수 `ALLOW_EMAIL_AUTH=true` 플래그로 개발/테스트 환경에서 이메일 로그인 유지 가능하게 설정 (선택).
  - 관련 파일: `.env.local`, `.env.example`

- [ ] 태스크 1b.1.10: Playwright MCP 테스트 - 소셜 로그인 흐름
  - 사전 조건: 태스크 1b.1.1 ~ 1b.1.9 완료
  - 검증 항목:
    1. `browser_navigate`로 `/auth/login` 접근 -> 소셜 로그인 버튼 3개(Google, Kakao, Apple) 존재 확인
    2. `browser_snapshot`으로 이메일/비밀번호 폼이 없는지 확인
    3. `browser_snapshot`으로 "소셜 계정으로 로그인" 안내 텍스트 확인
    4. `browser_navigate`로 `/auth/sign-up` 접근 -> 404 또는 리다이렉트 확인 (제거됨)
    5. `browser_navigate`로 `/` 접근 -> CTA 버튼이 로그인으로 이동하는지 확인
    6. `browser_console_messages`로 에러 없음 확인
  - 결과: 로그인 페이지 스크린샷 저장

#### 마일스톤 1b.2: DB 스키마 변경 - 사용자 설정 + 북마크 (F102, F103)

- [ ] 태스크 1b.2.1: `user_preferences` 테이블 생성 (F103)
  - 상세: `user_id UUID PK REFERENCES auth.users(id)`, `preferred_categories JSONB DEFAULT '[]'`, `dashboard_config JSONB DEFAULT '{"widgets": ["news", "weather"], "order": ["news", "weather"]}'`, `email_digest_enabled BOOLEAN DEFAULT false`, `weather_location TEXT DEFAULT 'seoul'`, `updated_at TIMESTAMPTZ DEFAULT now()`. RLS: 본인 데이터만 SELECT, INSERT, UPDATE. `ON DELETE CASCADE` (사용자 삭제 시).
  - 관련 파일: `supabase/migrations/[timestamp]_create_user_preferences.sql`

- [ ] 태스크 1b.2.2: `user_bookmarks` 테이블 생성 (F102)
  - 상세: `id UUID PK DEFAULT gen_random_uuid()`, `user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE`, `group_id UUID REFERENCES news_article_groups(id) ON DELETE CASCADE`, `created_at TIMESTAMPTZ DEFAULT now()`, `UNIQUE(user_id, group_id)`. RLS: 본인 데이터만 SELECT, INSERT, DELETE.
  - 관련 파일: `supabase/migrations/[timestamp]_create_user_bookmarks.sql`

- [ ] 태스크 1b.2.3: `database.types.ts` 재생성
  - 상세: 새 테이블 생성 후 타입 파일 갱신.
  - 관련 파일: `lib/supabase/database.types.ts`

#### 마일스톤 1b.3: 뉴스 검색 (F101)

- [ ] 태스크 1b.3.1: 검색용 pg_trgm GIN 인덱스 추가
  - 상세: `news_article_groups.fact_summary`와 `news_articles.title`에 `pg_trgm` GIN 인덱스 추가. `CREATE INDEX idx_fact_summary_trgm ON news_article_groups USING gin (fact_summary gin_trgm_ops);` 등. 기존 `title_normalized` GIN 인덱스는 유지.
  - 관련 파일: `supabase/migrations/[timestamp]_add_search_indexes.sql`

- [ ] 태스크 1b.3.2: 뉴스 검색 쿼리 함수 구현
  - 상세: `lib/news/queries.ts`에 `searchNewsGroups(query: string, category?: string, page?: number, limit?: number)` 함수 추가. `pg_trgm` ILIKE 검색. `fact_summary ILIKE '%query%' OR title ILIKE '%query%'` (대표 기사 제목). 카테고리 필터 병행 가능. 페이지네이션 지원.
  - 관련 파일: `lib/news/queries.ts`

- [ ] 태스크 1b.3.3: 검색바 컴포넌트 구현
  - 상세: `components/news/news-search-bar.tsx` 신규. Client Component. 입력 필드 + 검색 버튼 (lucide `Search` 아이콘). 엔터 키 또는 버튼 클릭으로 검색 실행. URL 쿼리 파라미터 `?q=검색어`와 동기화. `useRouter().push()`로 URL 업데이트. 디바운스 없음 (엔터/클릭 시에만 검색). 검색어 초기화(X 버튼) 지원.
  - 관련 파일: `components/news/news-search-bar.tsx`

- [ ] 태스크 1b.3.4: 뉴스 목록 페이지에 검색 기능 통합
  - 상세: `app/protected/news/page.tsx` 수정. `searchParams`에서 `q` 파라미터 추출. `q`가 있으면 `searchNewsGroups(q, category)` 호출, 없으면 기존 `getNewsGroups()` 호출. `NewsSearchBar` 컴포넌트를 카테고리 탭 상단에 배치. 검색 결과 없을 때 "검색 결과가 없습니다" 빈 상태 메시지.
  - 관련 파일: `app/protected/news/page.tsx`

- [ ] 태스크 1b.3.5: Playwright MCP 테스트 - 뉴스 검색
  - 사전 조건: 태스크 1b.3.4 완료
  - 검증 항목:
    1. `browser_navigate`로 `/protected/news` 접근 -> 검색바 존재 확인
    2. `browser_fill_form`으로 검색어 입력 -> `browser_press_key`로 Enter -> URL에 `?q=` 파라미터 반영 확인
    3. `browser_snapshot`으로 검색 결과 목록 표시 확인
    4. `browser_snapshot`으로 존재하지 않는 키워드 검색 -> "검색 결과가 없습니다" 메시지 확인
    5. `browser_network_requests`로 Supabase 검색 쿼리 호출 확인
    6. `browser_console_messages`로 에러 없음 확인
  - 결과: 검색 결과 스크린샷 저장

#### 마일스톤 1b.4: 뉴스 북마크 (F102)

- [ ] 태스크 1b.4.1: 북마크 API Route 구현
  - 상세: `app/api/news/bookmarks/route.ts` 신규. GET: 현재 사용자의 북마크 목록 조회 (group_id 목록). POST: 북마크 추가 (group_id). INSERT 전 COUNT 체크 (사용자당 최대 100개 제한). DELETE: 북마크 해제 (group_id). 모두 인증 필요 (`getClaims()` 검증).
  - 관련 파일: `app/api/news/bookmarks/route.ts`

- [ ] 태스크 1b.4.2: 북마크 버튼 컴포넌트 구현
  - 상세: `components/news/bookmark-button.tsx` 신규. Client Component. 북마크 아이콘 (lucide `Bookmark` / `BookmarkCheck`). 낙관적 UI 업데이트 (클릭 즉시 아이콘 변경, API 실패 시 롤백). 100개 초과 시 토스트 에러 메시지. `useOptimistic` 또는 로컬 상태 활용.
  - 관련 파일: `components/news/bookmark-button.tsx`

- [ ] 태스크 1b.4.3: 뉴스 카드/상세 페이지에 북마크 버튼 통합
  - 상세: `news-group-card.tsx`에 북마크 아이콘 추가 (카드 우측 상단). `news-detail.tsx`에 북마크 버튼 배치. 북마크 상태 확인을 위한 사용자별 북마크 목록 패칭 (클라이언트 사이드).
  - 관련 파일: `components/news/news-group-card.tsx`, `components/news/news-detail.tsx`

- [ ] 태스크 1b.4.4: 북마크 목록 쿼리 함수 구현
  - 상세: `lib/news/queries.ts`에 `getUserBookmarkedGroups(userId: string, page?: number, limit?: number)` 추가. `user_bookmarks` JOIN `news_article_groups` JOIN 대표 `news_articles`. 최신 북마크 순 정렬. 페이지네이션 지원.
  - 관련 파일: `lib/news/queries.ts`

- [ ] 태스크 1b.4.5: 뉴스 페이지에 "북마크" 탭 추가
  - 상세: `components/news/news-category-tabs.tsx` 수정. 기존 카테고리 탭 목록에 "북마크" 탭 추가. 선택 시 `?category=bookmarks` URL 파라미터. `app/protected/news/page.tsx`에서 `category === 'bookmarks'`일 때 `getUserBookmarkedGroups()` 호출.
  - 관련 파일: `components/news/news-category-tabs.tsx`, `app/protected/news/page.tsx`

- [ ] 태스크 1b.4.6: Playwright MCP 테스트 - 뉴스 북마크
  - 사전 조건: 태스크 1b.4.5 완료
  - 검증 항목:
    1. `browser_navigate`로 `/protected/news` 접근 -> 북마크 아이콘 존재 확인
    2. `browser_click`으로 북마크 버튼 클릭 -> 아이콘 변경(채워진 북마크) 확인
    3. `browser_click`으로 "북마크" 탭 클릭 -> 북마크한 뉴스 그룹 표시 확인
    4. `browser_click`으로 북마크 해제 -> 아이콘 변경(빈 북마크) 확인
    5. `browser_network_requests`로 북마크 API 호출 확인
    6. `browser_console_messages`로 에러 없음 확인
  - 결과: 북마크 전후 스크린샷 저장

#### 마일스톤 1b.5: 사용자 설정 페이지 (F103)

- [ ] 태스크 1b.5.1: 설정 페이지 데이터 쿼리/뮤테이션 함수 구현
  - 상세: `lib/user/preferences.ts` 신규. `getUserPreferences(userId: string)` - 설정 조회 (없으면 기본값 반환). `updateUserPreferences(userId: string, data: Partial<UserPreferences>)` - 설정 업데이트 (upsert). Supabase Server Client 사용.
  - 관련 파일: `lib/user/preferences.ts`

- [ ] 태스크 1b.5.2: 설정 API Route 구현
  - 상세: `app/api/user/preferences/route.ts` 신규. GET: 현재 사용자 설정 조회. PUT: 설정 업데이트 (preferred_categories, dashboard_config 등). 인증 필요.
  - 관련 파일: `app/api/user/preferences/route.ts`

- [ ] 태스크 1b.5.3: 프로필 섹션 컴포넌트 구현
  - 상세: `components/settings/profile-section.tsx` 신규. 소셜 로그인 프로바이더 표시, 이메일, 이름, 아바타, 가입일 표시. 읽기 전용 (소셜 프로필은 프로바이더에서 관리).
  - 관련 파일: `components/settings/profile-section.tsx`

- [ ] 태스크 1b.5.4: 선호 카테고리 설정 컴포넌트 구현
  - 상세: `components/settings/category-preferences.tsx` 신규. Client Component. 7개 카테고리 체크박스. 복수 선택 가능. 변경 시 API 호출로 저장. 저장 완료 토스트.
  - 관련 파일: `components/settings/category-preferences.tsx`

- [ ] 태스크 1b.5.5: 설정 페이지 구현 (`/protected/settings`)
  - 상세: `app/protected/settings/page.tsx` 신규. Server Component. 프로필 섹션 + 선호 카테고리 섹션 + (향후) 위젯 설정 섹션. 탭 또는 섹션 분리. `getUserPreferences()` 호출.
  - 관련 파일: `app/protected/settings/page.tsx`

- [ ] 태스크 1b.5.6: 헤더에 설정 링크 추가
  - 상세: `components/layout/header.tsx`의 사용자 드롭다운 메뉴(또는 AuthButton 영역)에 "설정" 링크 추가. `/protected/settings`로 이동. `components/layout/nav-links.ts` 또는 `mobile-nav.tsx`에도 반영.
  - 관련 파일: `components/layout/header.tsx`, `components/layout/mobile-nav.tsx`

- [ ] 태스크 1b.5.7: Playwright MCP 테스트 - 사용자 설정 페이지
  - 사전 조건: 태스크 1b.5.5, 1b.5.6 완료
  - 검증 항목:
    1. `browser_navigate`로 `/protected/settings` 접근 -> 프로필 섹션 렌더링 확인
    2. `browser_snapshot`으로 이메일, 가입일 표시 확인
    3. `browser_click`으로 카테고리 체크박스 선택/해제 -> 저장 확인
    4. `browser_network_requests`로 설정 API 호출 확인
    5. `browser_console_messages`로 에러 없음 확인
  - 결과: 설정 페이지 스크린샷 저장

#### 마일스톤 1b.6: 뉴스 공유 (F106)

- [ ] 태스크 1b.6.1: 공유 버튼/드롭다운 컴포넌트 구현
  - 상세: `components/news/share-button.tsx` 신규. Client Component. 공유 아이콘 (lucide `Share2`) 클릭 시 드롭다운 메뉴: "요약 복사" (팩트 요약 텍스트 클립보드 복사), "링크 복사" (`/protected/news/[groupId]` URL 클립보드 복사). Web Clipboard API (`navigator.clipboard.writeText()`) 사용. 복사 완료 시 "클립보드에 복사되었습니다" 토스트 메시지 (shadcn/ui `toast`).
  - 관련 파일: `components/news/share-button.tsx`

- [ ] 태스크 1b.6.2: 뉴스 상세 페이지에 공유 버튼 통합
  - 상세: `components/news/news-detail.tsx`에 `ShareButton` 컴포넌트 배치. 상단 메타 영역 또는 팩트 요약 카드 옆에 배치. 북마크 버튼과 나란히.
  - 관련 파일: `components/news/news-detail.tsx`

- [ ] 태스크 1b.6.3: shadcn/ui Toast 컴포넌트 설치 (미설치 시)
  - 상세: `npx shadcn@latest add toast sonner` 실행. 토스트 프로바이더를 루트 레이아웃에 추가 (미설치 시에만).
  - 관련 파일: `components/ui/sonner.tsx`, `app/layout.tsx`

- [ ] 태스크 1b.6.4: Playwright MCP 테스트 - 뉴스 공유
  - 사전 조건: 태스크 1b.6.2 완료
  - 검증 항목:
    1. `browser_navigate`로 뉴스 상세 페이지 접근 -> 공유 버튼 존재 확인
    2. `browser_click`으로 공유 버튼 클릭 -> 드롭다운 메뉴 표시 확인
    3. `browser_click`으로 "링크 복사" 클릭 -> 토스트 메시지 "클립보드에 복사되었습니다" 표시 확인
    4. `browser_console_messages`로 에러 없음 확인
  - 결과: 공유 드롭다운 스크린샷 저장

---

### v1.1c: 관리자 시스템 핵심 (예상 5~7일)

**목표:** 관리자 역할 시스템을 구축하고, 관리자 대시보드와 뉴스 관리 페이지를 구현하여 서비스 운영 기반을 확립한다.
**완료 기준:** 관리자 역할이 부여된 사용자만 `/admin/*` 라우트에 접근하여, 시스템 현황을 확인하고, 뉴스 소스/그룹/기사를 관리할 수 있다.

#### 마일스톤 1c.1: 관리자 역할 시스템 (F120)

- [ ] 태스크 1c.1.1: `admin_audit_logs` 테이블 생성
  - 상세: `id UUID PK DEFAULT gen_random_uuid()`, `admin_id UUID REFERENCES auth.users(id) NOT NULL`, `action TEXT NOT NULL` ('update_role' | 'toggle_source' | 'hide_group' | 'rerun_summary' 등), `target_type TEXT NOT NULL`, `target_id TEXT`, `details JSONB DEFAULT '{}'`, `created_at TIMESTAMPTZ DEFAULT now()`. RLS: 관리자만 SELECT, service_role INSERT. `admin_id`, `created_at DESC` 인덱스 생성.
  - 관련 파일: `supabase/migrations/[timestamp]_create_admin_audit_logs.sql`

- [ ] 태스크 1c.1.2: `database.types.ts` 재생성
  - 상세: 새 테이블 생성 후 타입 파일 갱신.
  - 관련 파일: `lib/supabase/database.types.ts`

- [ ] 태스크 1c.1.3: 관리자 역할 확인 유틸리티 구현
  - 상세: `lib/auth/admin.ts` 신규. `isAdmin(): Promise<boolean>` - `getClaims()`로 `app_metadata.role === 'admin'` 확인. `requireAdmin(): Promise<void>` - 관리자 아닌 경우 에러 throw. `getAdminClaims()` - claims 데이터 캐싱하여 이중 호출 방지.
  - 관련 파일: `lib/auth/admin.ts`

- [ ] 태스크 1c.1.4: `proxy.ts`에 관리자 라우트 보호 추가
  - 상세: `lib/supabase/proxy.ts` 수정. `/admin/*` 경로 접근 시 기존 `getClaims()` 결과에서 `app_metadata.role` 확인. 관리자가 아니면 `/protected`로 리다이렉트. **주의: `getClaims()` 이중 호출 금지** - 기존 호출 결과를 재사용.
  - 관련 파일: `lib/supabase/proxy.ts`

- [ ] 태스크 1c.1.5: 초기 관리자 계정 설정 SQL
  - 상세: 프로젝트 운영자 이메일에 관리자 역할 부여하는 SQL 작성. `UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb WHERE email = '<admin-email>';` Supabase SQL Editor에서 실행 (마이그레이션 파일이 아닌 수동 실행).
  - 관련 파일: 없음 (Supabase SQL Editor 수동 실행, 가이드 문서화)

- [ ] 태스크 1c.1.6: 관리자 레이아웃 구현 (`/admin/layout.tsx`)
  - 상세: `app/admin/layout.tsx` 신규. Server Component. `isAdmin()` 호출, 관리자 아니면 `redirect('/protected')`. `AdminSidebar` + `main` flex 레이아웃. 사이드바 네비게이션: 대시보드, 뉴스 관리, 콘텐츠 모더레이션, 사용자 관리, 시스템 모니터링, 사이트로 돌아가기.
  - 관련 파일: `app/admin/layout.tsx`

- [ ] 태스크 1c.1.7: 관리자 사이드바 컴포넌트 구현
  - 상세: `components/admin/admin-sidebar.tsx` 신규. 네비게이션 링크 목록 (아이콘 + 텍스트). 현재 경로 활성 상태 표시. 모바일 반응형 (시트 또는 접이식). "사이트로 돌아가기" 링크 (`/protected`).
  - 관련 파일: `components/admin/admin-sidebar.tsx`

- [ ] 태스크 1c.1.8: 헤더에 관리자 링크 추가
  - 상세: `components/layout/header.tsx` 수정. 관리자 역할인 경우에만 "관리자" 링크 표시. 클라이언트 측 role 확인 (Supabase Auth 세션의 `app_metadata`에서 읽기) 또는 서버 컴포넌트에서 조건부 렌더링.
  - 관련 파일: `components/layout/header.tsx`

- [ ] 태스크 1c.1.9: Playwright MCP 테스트 - 관리자 역할 시스템
  - 사전 조건: 태스크 1c.1.1 ~ 1c.1.8 완료
  - 검증 항목:
    1. `browser_navigate`로 일반 사용자 로그인 후 `/admin` 접근 -> `/protected`로 리다이렉트 확인
    2. 관리자 계정으로 로그인 후 `browser_navigate`로 `/admin` 접근 -> 관리자 대시보드 페이지 로드 확인
    3. `browser_snapshot`으로 사이드바 네비게이션 존재 확인
    4. `browser_console_messages`로 에러 없음 확인
  - 결과: 관리자/비관리자 접근 스크린샷 저장

#### 마일스톤 1c.2: 관리자 대시보드 (F121)

- [ ] 태스크 1c.2.1: 관리자 통계 쿼리 함수 구현
  - 상세: `lib/admin/queries.ts` 신규. `getSystemStats()` - 총 사용자 수 (`auth.admin.listUsers` count), 오늘 활성 사용자, 총 뉴스 그룹 수, 오늘 수집 기사 수, 대기 중인 요약 작업 수, 요약 완료율, 유효하지 않은 요약 수 (`is_valid = false`), 평균 그룹당 기사 수. `getDailyCollectionStats(days: number)` - 일별 기사 수집량. `getCategoryDistribution()` - 카테고리별 기사 분포. `getRecentActivity()` - 최근 수집 로그 5건, 최근 요약 완료/실패 5건. 모두 `getSupabaseAdmin()` 사용.
  - 관련 파일: `lib/admin/queries.ts`

- [ ] 태스크 1c.2.2: shadcn/ui chart 컴포넌트 설치
  - 상세: `npx shadcn@latest add chart` 실행. Recharts 기반 차트 컴포넌트 추가. 일별 수집량 Bar Chart, 카테고리 분포 Pie Chart에 활용.
  - 관련 파일: `components/ui/chart.tsx`

- [ ] 태스크 1c.2.3: 시스템 개요 카드 컴포넌트 구현
  - 상세: `components/admin/stats-cards.tsx` 신규. 4개 카드 그리드: 총 사용자 수, 총 뉴스 그룹 수, 오늘 수집 기사 수, 대기 중 요약 작업 수. 각 카드에 아이콘 + 숫자 + 라벨.
  - 관련 파일: `components/admin/stats-cards.tsx`

- [ ] 태스크 1c.2.4: 파이프라인 상태 + 품질 지표 컴포넌트 구현
  - 상세: `components/admin/pipeline-status.tsx` 신규. 마지막 수집 시간, 수집 성공/실패율, 요약 완료율 표시. `components/admin/quality-metrics.tsx` 신규. 유효하지 않은 요약 수, 평균 그룹당 기사 수, 필터링된 기사 수 표시.
  - 관련 파일: `components/admin/pipeline-status.tsx`, `components/admin/quality-metrics.tsx`

- [ ] 태스크 1c.2.5: 일별 수집량 차트 + 카테고리 분포 차트 구현
  - 상세: `components/admin/collection-chart.tsx` 신규. shadcn/ui Chart 기반 Bar Chart (일별 수집량 7일). `components/admin/category-chart.tsx` 신규. Pie Chart (카테고리별 기사 분포). Client Component (차트 인터랙션).
  - 관련 파일: `components/admin/collection-chart.tsx`, `components/admin/category-chart.tsx`

- [ ] 태스크 1c.2.6: 최근 활동 로그 컴포넌트 구현
  - 상세: `components/admin/recent-activity.tsx` 신규. 최근 수집 로그 5건 + 최근 요약 작업 5건 테이블. 상태 배지 (성공: green, 실패: red).
  - 관련 파일: `components/admin/recent-activity.tsx`

- [ ] 태스크 1c.2.7: 관리자 대시보드 페이지 구현 (`/admin`)
  - 상세: `app/admin/page.tsx` 신규. Server Component. `getSystemStats()`, `getDailyCollectionStats()`, `getCategoryDistribution()`, `getRecentActivity()` 호출. 카드 그리드 + 차트 + 활동 로그 배치. `Suspense` fallback 적용.
  - 관련 파일: `app/admin/page.tsx`

- [ ] 태스크 1c.2.8: Playwright MCP 테스트 - 관리자 대시보드
  - 사전 조건: 태스크 1c.2.7 완료
  - 검증 항목:
    1. `browser_navigate`로 관리자 로그인 후 `/admin` 접근 -> 대시보드 페이지 로드 확인
    2. `browser_snapshot`으로 통계 카드 4개 (사용자 수, 뉴스 그룹 수, 수집 기사 수, 대기 작업 수) 존재 확인
    3. `browser_snapshot`으로 파이프라인 상태, 품질 지표, 차트, 최근 활동 로그 렌더링 확인
    4. `browser_console_messages`로 에러 없음 확인
  - 결과: 관리자 대시보드 스크린샷 저장

#### 마일스톤 1c.3: 뉴스 관리 (F122)

- [ ] 태스크 1c.3.1: 뉴스 소스 관리 API Route 구현
  - 상세: `app/api/admin/news/sources/route.ts` 신규. GET: 소스 목록 조회 (마지막 수집 시간, 최근 성공/실패 횟수 포함). POST: 새 소스 추가 (RSS URL 유효성 검증 - 실제 RSS 피드인지 fetch + 파싱 테스트). PUT: 소스 편집 (이름, 카테고리, URL 수정, 활성 상태 토글). DELETE: 소스 삭제. 모든 요청에서 `requireAdmin()` 검증. 감사 로그 (`admin_audit_logs`) 기록.
  - 관련 파일: `app/api/admin/news/sources/route.ts`

- [ ] 태스크 1c.3.2: 뉴스 그룹 관리 API Route 구현
  - 상세: `app/api/admin/news/groups/route.ts` 신규. GET: 그룹 목록 조회 (필터: 카테고리, is_valid, is_summarized). PUT: 그룹 숨김/노출 토글 (`is_valid` 변경). POST (action: 'rerun_summary'): AI 요약 재실행 (`summarize_jobs`에 재등록, 기존 `fact_summary` 초기화). 일괄 작업 지원 (body에 `groupIds` 배열). 감사 로그 기록.
  - 관련 파일: `app/api/admin/news/groups/route.ts`

- [ ] 태스크 1c.3.3: 뉴스 기사 관리 API Route 구현
  - 상세: `app/api/admin/news/articles/route.ts` 신규. GET: 기사 검색 (제목, 소스, 날짜 범위 필터). DELETE: 기사 soft delete (`is_deleted = true`). PUT: 기사 그룹 변경 (`group_id` 수정). 감사 로그 기록.
  - 관련 파일: `app/api/admin/news/articles/route.ts`

- [ ] 태스크 1c.3.4: 소스 관리 UI 컴포넌트 구현
  - 상세: `components/admin/news-source-manager.tsx` 신규. Client Component. 소스 목록 테이블 (이름, URL, 카테고리, 활성 상태, 마지막 수집 시간, 총 기사 수). 활성/비활성 토글 스위치. "소스 추가" 버튼 -> 모달 (URL 입력, 언론사명, 카테고리 선택). 소스 편집/삭제. 소스별 상태 배지.
  - 관련 파일: `components/admin/news-source-manager.tsx`

- [ ] 태스크 1c.3.5: 그룹 관리 UI 컴포넌트 구현
  - 상세: `components/admin/news-group-manager.tsx` 신규. Client Component. 그룹 목록 테이블 (대표 기사 제목, 카테고리, 기사 수, 유효성, 요약 상태). 필터: 카테고리, 유효성, 요약 상태. 숨김/노출 토글. 요약 재실행 버튼. 체크박스 일괄 선택 + 일괄 작업 (숨김/노출, 요약 재실행). 그룹 클릭 시 상세 보기 (소속 기사, 현재 요약, 작업 이력).
  - 관련 파일: `components/admin/news-group-manager.tsx`

- [ ] 태스크 1c.3.6: 기사 관리 UI 컴포넌트 구현
  - 상세: `components/admin/news-article-manager.tsx` 신규. Client Component. 기사 검색 (제목, 소스, 날짜 범위). 기사 목록 테이블 (제목, 소스, 그룹, 발행일, 상태). 기사 삭제 (soft delete). 그룹 변경 (드롭다운 또는 검색).
  - 관련 파일: `components/admin/news-article-manager.tsx`

- [ ] 태스크 1c.3.7: 뉴스 관리 페이지 구현 (`/admin/news`)
  - 상세: `app/admin/news/page.tsx` 신규. 탭 구성: 소스 관리, 그룹 관리, 기사 관리. URL `?tab=` 파라미터와 동기화. 기본 탭: 소스 관리.
  - 관련 파일: `app/admin/news/page.tsx`

- [ ] 태스크 1c.3.8: Playwright MCP 테스트 - 뉴스 관리 페이지
  - 사전 조건: 태스크 1c.3.7 완료
  - 검증 항목:
    1. `browser_navigate`로 관리자 로그인 후 `/admin/news` 접근 -> 탭 UI 렌더링 확인
    2. `browser_click`으로 "소스 관리" 탭 -> 소스 목록 테이블 표시 확인
    3. `browser_click`으로 소스 활성/비활성 토글 -> 상태 변경 확인
    4. `browser_click`으로 "그룹 관리" 탭 -> 그룹 목록 표시 확인
    5. `browser_click`으로 그룹 숨김/노출 토글 확인
    6. `browser_click`으로 "기사 관리" 탭 -> 기사 검색 UI 확인
    7. `browser_network_requests`로 관리자 API 호출 확인
    8. `browser_console_messages`로 에러 없음 확인
  - 결과: 각 탭 스크린샷 저장

---

### v1.1d: 날씨 + 위젯 + 관리자 확장 (예상 5~7일)

**목표:** 두 번째 라이프 데이터(날씨)를 추가하고, 대시보드 위젯 시스템을 구현하며, 관리자 기능을 확장(콘텐츠 모더레이션, 사용자 관리, 시스템 모니터링)한다.
**완료 기준:** 대시보드에 날씨 위젯이 표시되고, 사용자가 위젯 표시/숨김을 설정할 수 있다. 관리자가 콘텐츠 필터 규칙, 사용자, 시스템 상태를 관리할 수 있다.

#### 마일스톤 1d.1: 날씨 위젯 (F104)

- [ ] 태스크 1d.1.1: OpenWeatherMap API 연동 모듈 구현
  - 상세: `lib/weather/api.ts` 신규. `getCurrentWeather(lat: number, lon: number)` - 현재 날씨 (온도, 상태, 아이콘, 최고/최저, 강수확률). `getHourlyForecast(lat: number, lon: number)` - 24시간 시간별 예보. `getWeeklyForecast(lat: number, lon: number)` - 7일 주간 예보. OpenWeatherMap Free tier API 호출. `WEATHER_API_KEY` 서버 전용 환경변수 사용. `use cache` 30분~1시간 캐싱.
  - 관련 파일: `lib/weather/api.ts`

- [ ] 태스크 1d.1.2: 위치-좌표 매핑 데이터 구현
  - 상세: `lib/weather/locations.ts` 신규. 한국 주요 시/도 단위 위경도 매핑. 기본값: 서울 (37.5665, 126.9780). 사용자 설정(`user_preferences.weather_location`)과 연동.
  - 관련 파일: `lib/weather/locations.ts`

- [ ] 태스크 1d.1.3: 환경 변수 설정 업데이트
  - 상세: `.env.local`에 `WEATHER_API_KEY` 추가. `.env.example`에 변수 템플릿 문서화.
  - 관련 파일: `.env.example`

- [ ] 태스크 1d.1.4: 날씨 대시보드 위젯 컴포넌트 구현
  - 상세: `components/weather/weather-widget.tsx` 신규. 현재 온도 (큰 텍스트), 날씨 상태 아이콘 (OpenWeatherMap 아이콘 URL 또는 lucide 아이콘 매핑), 최고/최저 온도, 강수확률 표시. shadcn/ui `Card` 기반. Server Component (`use cache` 활용).
  - 관련 파일: `components/weather/weather-widget.tsx`

- [ ] 태스크 1d.1.5: 날씨 상세 페이지 구현 (`/protected/weather`)
  - 상세: `app/protected/weather/page.tsx` 신규. Server Component. 현재 날씨 카드 + 시간별 예보 (24시간, 가로 스크롤 또는 그리드) + 주간 예보 (7일, 리스트). 위치 변경 드롭다운 (사용자 설정 연동). `Suspense` fallback 적용.
  - 관련 파일: `app/protected/weather/page.tsx`, `app/protected/weather/loading.tsx`

- [ ] 태스크 1d.1.6: 네비게이션에 "날씨" 메뉴 추가
  - 상세: 헤더/모바일 네비게이션에 "날씨" 링크 추가 (`/protected/weather`).
  - 관련 파일: `components/layout/header.tsx`, `components/layout/mobile-nav.tsx`

- [ ] 태스크 1d.1.7: 대시보드에 날씨 위젯 배치
  - 상세: `app/protected/page.tsx` 수정. 기존 뉴스 섹션 위 또는 옆에 `WeatherWidget` 컴포넌트 배치. `Suspense` fallback. 사용자 설정에서 위젯 숨김 시 표시 안 함 (F107 연동).
  - 관련 파일: `app/protected/page.tsx`

- [ ] 태스크 1d.1.8: Playwright MCP 테스트 - 날씨 위젯 + 상세 페이지
  - 사전 조건: 태스크 1d.1.7 완료
  - 검증 항목:
    1. `browser_navigate`로 `/protected` 접근 -> 날씨 위젯 렌더링 확인
    2. `browser_snapshot`으로 현재 온도, 날씨 아이콘, 최고/최저 온도 표시 확인
    3. `browser_navigate`로 `/protected/weather` 접근 -> 시간별/주간 예보 렌더링 확인
    4. `browser_network_requests`로 OpenWeatherMap API 호출 확인
    5. `browser_console_messages`로 에러 없음 확인
  - 결과: 대시보드 위젯 + 날씨 상세 스크린샷 저장

#### 마일스톤 1d.2: 대시보드 위젯 시스템 (F107)

- [ ] 태스크 1d.2.1: 위젯 설정 UI 컴포넌트 구현
  - 상세: `components/settings/widget-settings.tsx` 신규. Client Component. 위젯 목록 (뉴스, 날씨). 각 위젯별 표시/숨김 토글 스위치. 변경 시 `user_preferences.dashboard_config` API 호출로 저장. 기본값: 모든 위젯 표시.
  - 관련 파일: `components/settings/widget-settings.tsx`

- [ ] 태스크 1d.2.2: 설정 페이지에 위젯 설정 섹션 추가
  - 상세: `app/protected/settings/page.tsx` 수정. 기존 프로필 + 카테고리 섹션 아래에 "대시보드 위젯" 섹션 추가. `WidgetSettings` 컴포넌트 배치.
  - 관련 파일: `app/protected/settings/page.tsx`

- [ ] 태스크 1d.2.3: 대시보드에 위젯 설정 기반 조건부 렌더링 적용
  - 상세: `app/protected/page.tsx` 수정. `getUserPreferences()`로 `dashboard_config` 조회. 위젯 표시 여부에 따라 뉴스 섹션, 날씨 위젯 조건부 렌더링. 설정 미존재 시 기본값(모두 표시) 적용.
  - 관련 파일: `app/protected/page.tsx`

- [ ] 태스크 1d.2.4: Playwright MCP 테스트 - 위젯 시스템
  - 사전 조건: 태스크 1d.2.3 완료
  - 검증 항목:
    1. `browser_navigate`로 `/protected/settings` 접근 -> 위젯 설정 섹션 확인
    2. `browser_click`으로 뉴스 위젯 토글 해제 -> 설정 저장 확인
    3. `browser_navigate`로 `/protected` 접근 -> 뉴스 섹션 미표시 확인
    4. `browser_navigate`로 `/protected/settings` -> 뉴스 위젯 토글 활성화 -> 대시보드 복귀 -> 뉴스 섹션 표시 확인
    5. `browser_console_messages`로 에러 없음 확인
  - 결과: 설정/대시보드 스크린샷 저장

#### 마일스톤 1d.3: 콘텐츠 모더레이션 (F123)

- [ ] 태스크 1d.3.1: 필터 관리 API Route 구현
  - 상세: `app/api/admin/moderation/filters/route.ts` 신규. GET: 필터 규칙 목록 조회. POST: 필터 추가 (키워드 + 타입). PUT: 필터 수정 (키워드 변경, 활성/비활성 토글). DELETE: 필터 삭제. `requireAdmin()` 검증. 감사 로그 기록.
  - 관련 파일: `app/api/admin/moderation/filters/route.ts`

- [ ] 태스크 1d.3.2: 품질 검토 API Route 구현
  - 상세: `app/api/admin/moderation/quality/route.ts` 신규. GET: `is_valid = false`인 그룹 목록 + 요약 실패 그룹 목록 조회. PUT (action: 'approve'): `is_valid = true`로 변경 (수동 승인). PUT (action: 'reject'): 숨김 유지. POST (action: 'rerun'): 요약 재실행. `requireAdmin()` 검증. 감사 로그 기록.
  - 관련 파일: `app/api/admin/moderation/quality/route.ts`

- [ ] 태스크 1d.3.3: 필터 관리 UI 컴포넌트 구현
  - 상세: `components/admin/filter-manager.tsx` 신규. Client Component. 블랙리스트/화이트리스트 키워드 목록 (태그 형태). 키워드 추가 (입력 + 타입 선택). 키워드 삭제. 활성/비활성 토글. 필터 테스트 기능: 제목 입력 -> 필터링 여부 실시간 미리보기. 필터별 차단 기사 수 통계.
  - 관련 파일: `components/admin/filter-manager.tsx`

- [ ] 태스크 1d.3.4: 품질 검토 큐 UI 컴포넌트 구현
  - 상세: `components/admin/quality-review-queue.tsx` 신규. Client Component. `is_valid = false` 그룹 목록 테이블. 각 항목: 대표 기사 제목, 실패 사유, 현재 요약 미리보기. "승인" (노출 복구) / "거부" (숨김 유지) / "재요약" 버튼.
  - 관련 파일: `components/admin/quality-review-queue.tsx`

- [ ] 태스크 1d.3.5: 콘텐츠 모더레이션 페이지 구현 (`/admin/moderation`)
  - 상세: `app/admin/moderation/page.tsx` 신규. 탭 구성: 필터 관리, 품질 검토. URL `?tab=` 파라미터와 동기화.
  - 관련 파일: `app/admin/moderation/page.tsx`

- [ ] 태스크 1d.3.6: Playwright MCP 테스트 - 콘텐츠 모더레이션
  - 사전 조건: 태스크 1d.3.5 완료
  - 검증 항목:
    1. `browser_navigate`로 관리자 로그인 후 `/admin/moderation` 접근 -> 탭 UI 확인
    2. `browser_click`으로 "필터 관리" 탭 -> 블랙리스트/화이트리스트 키워드 목록 확인
    3. `browser_click`으로 "품질 검토" 탭 -> 검토 큐 목록 확인
    4. `browser_console_messages`로 에러 없음 확인
  - 결과: 모더레이션 페이지 스크린샷 저장

#### 마일스톤 1d.4: 사용자 관리 (F124)

- [ ] 태스크 1d.4.1: 사용자 관리 API Route 구현
  - 상세: `app/api/admin/users/route.ts` 신규. GET: 사용자 목록 조회 (`auth.admin.listUsers`, 페이지네이션, 검색 필터). `app/api/admin/users/[userId]/route.ts` 신규. PUT: 역할 변경 (`auth.admin.updateUserById`, `app_metadata.role`). 자기 자신 역할 변경 금지 (안전장치). PUT: 계정 상태 변경 (`banned_until` 활용). `requireAdmin()` 검증. 감사 로그 기록.
  - 관련 파일: `app/api/admin/users/route.ts`, `app/api/admin/users/[userId]/route.ts`

- [ ] 태스크 1d.4.2: 사용자 목록 UI 컴포넌트 구현
  - 상세: `components/admin/user-list.tsx` 신규. Client Component. 사용자 테이블 (이메일, 이름, 가입일, 마지막 로그인, 역할, 프로바이더). 검색 (이메일/이름). 페이지네이션. 역할 변경 드롭다운 (user/admin). 계정 상태 토글 (활성/정지). 사용자 클릭 시 상세 보기.
  - 관련 파일: `components/admin/user-list.tsx`

- [ ] 태스크 1d.4.3: 사용자 상세 정보 UI 컴포넌트 구현
  - 상세: `components/admin/user-detail.tsx` 신규. Client Component. 프로필 정보, 북마크 수, 설정 내용, 활동 이력. 역할/상태 변경 버튼.
  - 관련 파일: `components/admin/user-detail.tsx`

- [ ] 태스크 1d.4.4: 사용자 관리 페이지 구현 (`/admin/users`)
  - 상세: `app/admin/users/page.tsx` 신규. Server Component. 상단 통계 (총 사용자 수, 오늘 가입 수, 프로바이더별 분포). 사용자 목록.
  - 관련 파일: `app/admin/users/page.tsx`

- [ ] 태스크 1d.4.5: Playwright MCP 테스트 - 사용자 관리
  - 사전 조건: 태스크 1d.4.4 완료
  - 검증 항목:
    1. `browser_navigate`로 관리자 로그인 후 `/admin/users` 접근 -> 사용자 목록 표시 확인
    2. `browser_snapshot`으로 사용자 테이블 (이메일, 역할 등) 렌더링 확인
    3. `browser_console_messages`로 에러 없음 확인
  - 결과: 사용자 관리 페이지 스크린샷 저장

#### 마일스톤 1d.5: 시스템 모니터링 (F125)

- [ ] 태스크 1d.5.1: 모니터링 데이터 쿼리 함수 구현
  - 상세: `lib/admin/queries.ts`에 추가. `getFetchLogs(filters)` - 수집 로그 조회 (소스별, 날짜별, 성공/실패 필터). `getSummarizeJobs(filters)` - 요약 작업 조회 (상태별 필터). `getSystemStatus()` - 마지막 Cron 실행 시간, 워커 마지막 활동 시간 (최근 completed/processing 작업 타임스탬프 추정), 주요 테이블별 레코드 수.
  - 관련 파일: `lib/admin/queries.ts`

- [ ] 태스크 1d.5.2: 모니터링 API Route 구현
  - 상세: `app/api/admin/monitoring/logs/route.ts` 신규. GET: 수집 로그 조회 (필터 + 페이지네이션). `app/api/admin/monitoring/jobs/route.ts` 신규. GET: 요약 작업 조회. PUT: 실패 작업 재시도 (status -> pending), 장기 processing 작업 리셋. `requireAdmin()` 검증.
  - 관련 파일: `app/api/admin/monitoring/logs/route.ts`, `app/api/admin/monitoring/jobs/route.ts`

- [ ] 태스크 1d.5.3: 수집 로그 뷰어 컴포넌트 구현
  - 상세: `components/admin/fetch-log-viewer.tsx` 신규. Client Component. 로그 테이블 (수집 시간, 소스명, 수집 건수, 신규 건수, 필터링 건수, 에러 메시지). 소스별/날짜별/성공-실패 필터. 최신순 정렬, 페이지네이션.
  - 관련 파일: `components/admin/fetch-log-viewer.tsx`

- [ ] 태스크 1d.5.4: 요약 작업 관리 컴포넌트 구현
  - 상세: `components/admin/job-manager.tsx` 신규. Client Component. 작업 테이블 (작업 ID, 그룹 제목, 상태, 생성 시간, 완료 시간, 소요 시간). 상태별 필터 (pending/processing/completed/failed). 실패 작업 재시도 버튼. 장기 processing 리셋 버튼. 상태별 작업 수/평균 처리 시간/성공률 통계.
  - 관련 파일: `components/admin/job-manager.tsx`

- [ ] 태스크 1d.5.5: 시스템 상태 컴포넌트 구현
  - 상세: `components/admin/system-status.tsx` 신규. Client Component. 파이프라인 상태 (마지막 Cron 실행, 다음 예정, 최근 결과). 워커 상태 (마지막 활동 시간, 활동 여부 추정). DB 상태 (주요 테이블별 레코드 수). 정리 현황 (마지막 cleanup 실행 시간).
  - 관련 파일: `components/admin/system-status.tsx`

- [ ] 태스크 1d.5.6: 시스템 모니터링 페이지 구현 (`/admin/monitoring`)
  - 상세: `app/admin/monitoring/page.tsx` 신규. 탭 구성: 수집 로그, 요약 작업, 시스템 상태. URL `?tab=` 파라미터와 동기화.
  - 관련 파일: `app/admin/monitoring/page.tsx`

- [ ] 태스크 1d.5.7: Playwright MCP 테스트 - 시스템 모니터링
  - 사전 조건: 태스크 1d.5.6 완료
  - 검증 항목:
    1. `browser_navigate`로 관리자 로그인 후 `/admin/monitoring` 접근 -> 탭 UI 확인
    2. `browser_click`으로 "수집 로그" 탭 -> 로그 테이블 렌더링 확인
    3. `browser_click`으로 "요약 작업" 탭 -> 작업 목록 확인
    4. `browser_click`으로 "시스템 상태" 탭 -> 상태 정보 확인
    5. `browser_console_messages`로 에러 없음 확인
  - 결과: 모니터링 페이지 스크린샷 저장

#### 마일스톤 1d.6: v1.1 통합 테스트 및 배포

- [ ] 태스크 1d.6.1: v1.1 전체 빌드 검증
  - 상세: `npm run build` 실행하여 빌드 에러 없음 확인. `npm run lint` 통과 확인. `npm run type-check` 통과 확인.

- [ ] 태스크 1d.6.2: 프로덕션 환경 변수 설정
  - 상세: Vercel 프로젝트에 새 환경 변수 추가 (`WEATHER_API_KEY`). Supabase 대시보드에 OAuth 프로바이더 설정 최종 확인. RLS 정책 최종 확인.

- [ ] 태스크 1d.6.3: Playwright MCP 테스트 - v1.1 전체 사용자 여정
  - 검증 항목:
    1. `browser_navigate`로 `/` 접근 -> "시작하기" 클릭 -> 소셜 로그인 페이지
    2. 테스트 세션으로 로그인 -> 대시보드에 뉴스 위젯 + 날씨 위젯 확인
    3. 뉴스 카드 클릭 -> 상세 페이지에서 팩트 요약 + 관련 기사 확인
    4. 북마크 버튼 클릭 -> 북마크 탭 확인
    5. 뉴스 검색 실행 -> 결과 확인
    6. 설정 페이지 접근 -> 카테고리/위젯 설정 변경
    7. (관리자) `/admin` 대시보드 -> 뉴스 관리 -> 모더레이션 -> 사용자 관리 -> 모니터링
    8. `browser_console_messages`로 전체 여정에서 에러 없음 확인
  - 결과: 주요 화면별 스크린샷 저장

- [ ] 태스크 1d.6.4: CLAUDE.md 업데이트
  - 상세: 새로 추가된 라우트, 컴포넌트, DB 테이블, 환경 변수, 아키텍처 변경 사항을 CLAUDE.md에 반영.
  - 관련 파일: `CLAUDE.md`

---

## 우선순위 매트릭스

| 기능                 | ID   | 우선순위 | 복잡도 | 단계  | 의존성           |
| -------------------- | ---- | -------- | ------ | ----- | ---------------- |
| 뉴스 카드 UI 간소화  | F108 | Must     | 낮음   | v1.1a | 없음             |
| 뉴스 상세 페이지     | F109 | Must     | 중간   | v1.1a | F108             |
| 통일된 팩트 요약 폼  | F110 | Must     | 낮음   | v1.1a | F109             |
| AI 요약 품질 관리    | F111 | Must     | 중간   | v1.1a | 없음             |
| 그룹핑 시스템 개선   | F112 | Should   | 중간   | v1.1a | 없음             |
| 콘텐츠 필터링        | F113 | Should   | 낮음   | v1.1a | 없음             |
| 소셜 로그인          | F100 | Must     | 높음   | v1.1b | 없음             |
| 뉴스 검색            | F101 | Must     | 중간   | v1.1b | 없음             |
| 뉴스 북마크          | F102 | Must     | 중간   | v1.1b | F100             |
| 사용자 설정 페이지   | F103 | Must     | 중간   | v1.1b | F100             |
| 뉴스 공유            | F106 | Could    | 낮음   | v1.1b | F109             |
| 관리자 역할 시스템   | F120 | Must     | 중간   | v1.1c | F100             |
| 관리자 대시보드      | F121 | Must     | 중간   | v1.1c | F120             |
| 뉴스 관리            | F122 | Must     | 높음   | v1.1c | F120             |
| 날씨 위젯            | F104 | Should   | 중간   | v1.1d | F103             |
| 대시보드 위젯 시스템 | F107 | Should   | 낮음   | v1.1d | F103             |
| 콘텐츠 모더레이션    | F123 | Should   | 중간   | v1.1d | F120, F111, F113 |
| 사용자 관리          | F124 | Should   | 중간   | v1.1d | F120             |
| 시스템 모니터링      | F125 | Should   | 중간   | v1.1d | F120             |

## 리스크 및 고려사항

### 기술적 리스크

- **OAuth 프로바이더 설정 복잡도**: Google, Kakao, Apple 각각 별도의 개발자 콘솔 설정, 리뷰 프로세스가 필요하다. Apple은 유료 개발자 계정 필수. Kakao는 동의 항목 설정이 세밀하다.
- **소셜 로그인 전환 시 기존 사용자**: 이메일/비밀번호 사용자가 동일 이메일의 소셜 계정으로 전환할 때 자동 링킹이 정상 동작하는지 철저한 테스트 필요.
- **한국어 FTS 미지원**: PostgreSQL 내장 FTS는 한국어 사전이 없어 `pg_trgm` ILIKE로 대체. 대량 데이터에서 성능 저하 가능성. Typesense/Meilisearch 도입 시점 모니터링 필요.
- **OpenWeatherMap API 무료 제한**: Free tier에서 1분당 60회 호출 제한. `use cache` 캐싱으로 대응하되, 사용자 수 증가 시 유료 전환 또는 캐시 TTL 조정 필요.
- **`use cache` 내 쿠키 접근 금지**: 사용자별 데이터(북마크, 설정)는 캐시 함수 내에서 쿠키 기반 인증을 사용할 수 없다. 클라이언트 사이드 페칭 또는 캐시 키 분리 전략 필요.
- **`proxy.ts` getClaims() 이중 호출 방지**: 관리자 라우트 보호 추가 시 기존 getClaims() 결과를 반드시 재사용해야 한다. 이중 호출은 요청 레이턴시 증가 원인.
- **shadcn/ui charts (Recharts)**: Recharts 번들 사이즈가 크므로 관리자 페이지에만 코드 스플리팅 적용. 일반 사용자 번들에 포함되지 않도록 주의.

### 일정 리스크

- **1인 개발**: v1.1 전체를 한 번에 릴리스하지 않고 v1.1a~d로 분할하여 점진적 배포. 각 단계별 프로덕션 배포 후 안정화 기간 확보.
- **OAuth 콘솔 심사 지연**: Google/Apple OAuth 앱 심사에 수일~수주 소요 가능. 개발 모드에서 선 테스트 후 프로덕션 심사 병행.
- **v1.1c~d 범위**: 관리자 시스템 5개 페이지는 상당한 분량. 핵심(F120, F121, F122)만 우선 구현하고, 나머지(F123~F125)는 운영 필요에 따라 유동적으로 진행.

### 의존성 리스크

- **F102, F103 -> F100**: 북마크와 설정 기능은 소셜 로그인(사용자 식별) 완료 후에만 의미 있다. F100 지연 시 F102, F103도 지연.
- **F120 -> F100**: 관리자 역할 시스템은 소셜 로그인의 `app_metadata` 활용. F100 완료 후 구현.
- **F122 -> F120**: 뉴스 관리는 관리자 역할 시스템 기반. F120 완료 필수.
- **F123 -> F111, F113**: 콘텐츠 모더레이션은 AI 품질 관리와 콘텐츠 필터링 구현 후 관리 UI 제공. v1.1a 완료 후 v1.1d에서 구현.
- **F104 -> F103**: 날씨 위젯의 위치 설정은 사용자 설정 페이지(F103)에 의존.

### 보안 고려사항

- **관리자 API 보호**: 모든 `/api/admin/*` Route에서 `requireAdmin()` 필수. 실수로 누락 시 일반 사용자가 관리 기능 접근 가능.
- **감사 로그**: 관리자 행위는 `admin_audit_logs`에 기록하여 추적 가능하게 한다. 민감한 작업(역할 변경, 계정 정지)은 상세 정보 포함.
- **RLS 정책**: 새 테이블(`user_preferences`, `user_bookmarks`, `content_filters`, `admin_audit_logs`) 모두 적절한 RLS 정책 필수.
- **ON DELETE CASCADE**: `user_bookmarks`의 `user_id`, `group_id` FK에 CASCADE 적용. 사용자/그룹 삭제 시 자동 정리.

## 가정 사항

- v1.0 MVP가 프로덕션에 정상 운영 중이며, DB 스키마와 기존 코드가 안정된 상태이다.
- Google Cloud Console, Kakao Developers, Apple Developer 계정이 준비되어 OAuth 앱 등록이 가능하다.
- OpenWeatherMap Free tier API 키가 발급 가능하다.
- Supabase 프로젝트의 Authentication > Providers 설정 접근이 가능하다.
- Vercel Hobby 플랜의 Cron 실행 빈도 제한을 현재 상태(하루 2회)로 유지한다.

## 변경 이력

| 날짜       | 버전 | 변경 내용                                                           |
| ---------- | ---- | ------------------------------------------------------------------- |
| 2026-02-16 | 2.0  | 초기 로드맵 생성 (PRD v2.4 기반)                                    |
| 2026-02-16 | 2.1  | v1.1 범위로 축소 (v1.2, v2.0 섹션 제거 — 별도 로드맵으로 분리 예정) |

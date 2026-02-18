# Lifeboard (라이프보드) PRD

## 핵심 정보

**목적**: 인생의 모든 데이터를 한눈에 볼 수 있는 통합 대시보드. 뉴스, 날씨, 메모, 일정 등 다양한 정보를 한 곳에서 관리하고 빠르게 파악할 수 있는 개인 라이프 허브
**사용자**: 일상의 다양한 정보를 효율적으로 관리하고 한눈에 파악하고 싶은 개인 사용자
**현재 버전**: v1.1d (프로덕션 운영 중)
**프로덕션**: https://lifeboard-omega.vercel.app
**GitHub**: https://github.com/ovlae6252-a11y/lifeboard

---

## 현재 상태 (v1.1d 완료)

MVP (Phase 0~5) 및 v1.1(a~d) 전체가 완료되어 프로덕션에서 운영 중이다.

| ID       | 기능명             | 버전  | 설명                                                                     |
| -------- | ------------------ | ----- | ------------------------------------------------------------------------ |
| **F001** | RSS 뉴스 수집      | v1.0  | 20+ 한국 언론사 RSS 피드 자동 수집 (Vercel Cron, 하루 2회, KST 8시/20시) |
| **F002** | 중복 기사 그룹핑   | v1.0  | pg_trgm 트라이그램 유사도 0.5 기반 배치 그룹핑 (RPC, 72시간 범위)        |
| **F003** | AI 팩트 요약       | v1.0  | Ollama PC 워커 (qwen2.5:14b, Realtime + 30초 폴링), 한국어 품질 검증     |
| **F004** | 뉴스 카테고리 필터 | v1.0  | 7개 카테고리 탭 (전체/정치/경제/사회/생활문화/IT과학/세계)               |
| **F005** | 뉴스 그룹 카드     | v1.0  | 팩트 요약 불릿 포인트 + 관련 기사 링크 + 상대시간 자동 갱신              |
| **F006** | 뉴스 대시보드 섹션 | v1.0  | 대시보드 메인에 최신 뉴스 6개 카드 표시                                  |
| **F010** | 수집 로그 관리     | v1.0  | 소스별 수집 성공/실패 로그 + 자동 정리 (90일 로그, 30일 완료 작업)       |
| **F011** | 반응형 레이아웃    | v1.0  | 모바일 햄버거 메뉴(Sheet) + 태블릿/데스크톱 네비게이션                   |
| **F012** | 페이지네이션       | v1.0  | URL 기반 오프셋 페이지네이션 (?page=N), 페이지당 20개                    |
| **F013** | 에러/빈 상태 처리  | v1.0  | 에러 바운더리, 로딩 스켈레톤, 카테고리별 빈 상태 메시지                  |
| **F100** | 소셜 로그인        | v1.1a | Google, Kakao OAuth 통합. 이메일/비밀번호 인증 제거                      |
| **F101** | 뉴스 검색          | v1.1b | pg_trgm 유사도 기반 제목/요약 검색 (search_news_groups RPC)              |
| **F102** | 뉴스 북마크        | v1.1b | 관심 뉴스 저장/해제 (최대 100개), 낙관적 UI 업데이트                     |
| **F103** | 사용자 설정 페이지 | v1.1b | 프로필 확인, 선호 카테고리 설정, 대시보드 위젯 표시 토글                 |
| **F104** | 날씨 위젯          | v1.1d | OpenWeatherMap 연동, 현재 날씨 + 시간별/주간 예보, 대시보드 위젯         |
| **F105** | 뉴스 소스 관리     | v1.1c | RSS 소스 CRUD (관리자), 활성/비활성 토글, URL 유효성 검증                |
| **F106** | 뉴스 공유          | v1.1b | 팩트 요약/링크 복사, Toast 알림 (sonner)                                 |
| **F107** | 대시보드 위젯 설정 | v1.1d | 뉴스/날씨 위젯 표시 토글 (dashboard_config JSONB)                        |
| **F108** | 뉴스 상세 페이지   | v1.1a | 팩트 요약 + 관련 기사 전체 목록, 북마크/공유 버튼                        |
| **F110** | AI 요약 품질 관리  | v1.1a | 한국어 전용 강제, 한글 비율 70% 검증, 실패 시 is_valid=false 처리        |
| **F111** | 콘텐츠 필터링      | v1.1a | content_filters 테이블 기반 블랙리스트/화이트리스트 키워드 필터링        |
| **F120** | 관리자 역할 시스템 | v1.1c | Supabase app_metadata.role 기반 RBAC, 관리자 전용 라우트 보호            |
| **F121** | 관리자 대시보드    | v1.1c | 시스템 통계, 파이프라인 상태, Recharts 차트, 최근 활동 로그              |
| **F122** | 뉴스 관리          | v1.1c | 소스/그룹/기사 탭, 숨김 토글, AI 요약 재실행, soft-delete                |
| **F123** | 콘텐츠 모더레이션  | v1.1d | 필터 규칙 관리 UI, 품질 검토 큐, 수동 승인/거부                          |
| **F124** | 사용자 관리        | v1.1d | 사용자 목록/검색, 역할 변경, 계정 정지                                   |
| **F125** | 시스템 모니터링    | v1.1d | 수집 로그 뷰어, 요약 작업 관리, 시스템 상태 (탭 구성)                    |

---

## 기술 스택

| 영역                  | 기술                     | 버전/비고                                               |
| --------------------- | ------------------------ | ------------------------------------------------------- |
| 프론트엔드 프레임워크 | Next.js (App Router)     | 16 (Turbopack, cacheComponents)                         |
| UI 라이브러리         | React                    | 19                                                      |
| 언어                  | TypeScript               | 5 (strict)                                              |
| 스타일링              | Tailwind CSS             | 4 (CSS 변수 기반 테마, OKLCH)                           |
| UI 컴포넌트           | shadcn/ui                | new-york 스타일                                         |
| 아이콘                | Lucide React             | -                                                       |
| 다크모드              | next-themes              | class 방식                                              |
| 폰트                  | next/font/google         | Libre Baskerville + Noto Sans KR + Lora + IBM Plex Mono |
| 차트                  | Recharts                 | 관리자 대시보드 차트                                    |
| Toast 알림            | sonner                   | 테마 통합                                               |
| BaaS                  | Supabase (@supabase/ssr) | 인증, DB, RLS, Realtime                                 |
| 데이터베이스          | PostgreSQL               | Supabase 호스팅, pg_trgm                                |
| AI                    | Ollama (qwen2.5:14b)     | 로컬 LLM, 별도 PC 상주 워커                             |
| 날씨 API              | OpenWeatherMap           | Free tier, 30분 캐시                                    |
| RSS 파싱              | rss-parser               | npm 패키지                                              |
| 배포                  | Vercel                   | Cron 작업, Speed Insights                               |
| 코드 품질             | ESLint + Prettier        | Husky + lint-staged (pre-commit)                        |
| E2E 테스트            | Playwright               | auth setup 패턴                                         |
| 패키지 관리           | npm                      | -                                                       |

---

## 현재 아키텍처

```
[Vercel Cron 하루 2회 (KST 08:00, 20:00)]
  |
  v
[/api/news/collect]
  |-- RSS 파싱 (rss-parser)
  |-- 콘텐츠 필터링 (content-filter.ts, content_filters 테이블)
  |-- 중복 필터링
  |-- DB INSERT → [news_articles]
  |-- 배치 그룹핑 RPC (batch_group_articles, 유사도 0.5, 72h)
  |-- 요약 작업 등록 RPC (enqueue_summarize_jobs) → [summarize_jobs]
  |-- 캐시 무효화 (revalidateTag)
  v
[Ollama PC 워커 (scripts/)]
  Supabase Realtime + 30초 폴링
  |-- pending 감지 → 낙관적 잠금
  |-- 기사 제목+본문 조합 → qwen2.5:14b 팩트 추출
  |-- 한국어 품질 검증 (validateKoreanContent, 한글 70% 기준)
  |-- 성공: fact_summary 저장 + is_valid=true
  |-- 실패: error_message 저장 + is_valid=false
  v
[Supabase DB]
  |
  v
[Next.js 웹앱]
  use cache + admin 클라이언트 → 데이터 조회
  proxy.ts (미들웨어) → 세션 갱신 + 미인증 리다이렉트

[OpenWeatherMap API]
  lib/weather/api.ts → "use cache" 30분 캐시
  → weather-widget.tsx (대시보드) + /protected/weather (상세)
```

---

## 현재 라우팅 구조

| 경로                        | 목적                              | 인증        |
| --------------------------- | --------------------------------- | ----------- |
| `/`                         | 공개 랜딩 페이지                  | 불필요      |
| `/auth/login`               | 소셜 로그인 (Google, Kakao)       | 불필요      |
| `/auth/callback`            | OAuth 콜백 처리                   | 불필요      |
| `/auth/error`               | OAuth 에러 표시                   | 불필요      |
| `/protected`                | 대시보드 (뉴스 6개 + 날씨 위젯)   | 필수        |
| `/protected/news`           | 뉴스 목록 (카테고리 탭 + 검색)    | 필수        |
| `/protected/news/[groupId]` | 뉴스 상세 (팩트 요약 + 관련 기사) | 필수        |
| `/protected/settings`       | 사용자 설정                       | 필수        |
| `/protected/weather`        | 날씨 상세 (시간별/주간 예보)      | 필수        |
| `/admin`                    | 관리자 대시보드                   | admin 필수  |
| `/admin/news`               | 뉴스 소스/그룹/기사 관리          | admin 필수  |
| `/admin/moderation`         | 콘텐츠 필터 + 품질 검토           | admin 필수  |
| `/admin/users`              | 사용자 관리                       | admin 필수  |
| `/admin/monitoring`         | 시스템 모니터링                   | admin 필수  |
| `/api/news/collect`         | RSS 수집 API                      | CRON_SECRET |
| `/api/news/bookmarks`       | 북마크 CRUD                       | 필수        |
| `/api/user/preferences`     | 사용자 설정 API                   | 필수        |
| `/api/admin/*`              | 관리자 API 라우트                 | admin 필수  |

---

## 사용자 여정

```
1. [홈 페이지 /]
   ↓ 로그인 필요 → 자동 리다이렉트

2. [로그인 페이지 /auth/login]
   ↓ Google 또는 Kakao 소셜 로그인

3. [대시보드 /protected]
   - 최신 뉴스 6개 카드
   - 날씨 위젯 (설정된 위치)
   - (v1.2) 빠른 메모 위젯
   ↓ 뉴스 카드 클릭 → 뉴스 상세
   ↓ 날씨 클릭 → 날씨 상세

4. [뉴스 /protected/news]
   - 카테고리 탭 + 검색바
   - 그룹 카드 목록 + 페이지네이션
   - (v1.2) 선호 카테고리 기본 탭 활성
   ↓ 카드 클릭

5. [뉴스 상세 /protected/news/[groupId]]
   - 팩트 요약 (마크다운)
   - 관련 기사 전체 목록
   - 북마크/공유 버튼

6. [날씨 /protected/weather]
   - 현재 날씨 상세
   - 시간별 예보 (24시간)
   - 주간 예보 (7일)

7. [설정 /protected/settings]
   - 프로필 정보
   - 선호 카테고리 설정
   - 대시보드 위젯 표시 토글
   - (v1.2) 날씨 위치 변경

--- 관리자 전용 (role === 'admin') ---

8. [관리자 대시보드 /admin]
   - 시스템 통계 카드
   - 파이프라인 상태 + 차트
   - 최근 활동 로그

9. [뉴스 관리 /admin/news]
   소스 탭: RSS 소스 CRUD
   그룹 탭: 숨김/노출, AI 재실행
   기사 탭: 검색, soft-delete, 그룹 변경

10. [콘텐츠 모더레이션 /admin/moderation]
    필터 탭: 블랙리스트/화이트리스트 키워드 관리
    품질 탭: AI 요약 품질 검토 큐

11. [사용자 관리 /admin/users]
    - 사용자 목록 + 이메일 검색
    - 역할 변경, 계정 정지

12. [시스템 모니터링 /admin/monitoring]
    수집 로그 탭: 소스/상태/날짜 필터
    요약 작업 탭: retry/reset
    시스템 상태 탭: DB 통계, 워커 활동
```

---

## v1.2 기능 명세

> **목표**: 뉴스 콘텐츠 품질을 실질적으로 개선하고, 개인화 기능을 실제로 활용하며, 시스템 안정성(SEO, 에러 처리, 성능)을 높인다.

### 기능 목록

| ID       | 기능명                    | 우선순위 | 단계  | 출처                                   |
| -------- | ------------------------- | -------- | ----- | -------------------------------------- |
| **F200** | 뉴스 내용정리 시스템 개편 | Must     | v1.2a | ISSUE.md 관리자 코멘트 + 사용자 피드백 |
| **F206** | 날씨 위치 설정 개선       | Must     | v1.2a | ISSUE.md 사용자 피드백                 |
| **F201** | 빠른 메모                 | Must     | v1.2b | 기존 PRD                               |
| **F207** | 선호 카테고리 실제 활용   | Must     | v1.2b | 코드베이스 분석 (데드 코드)            |
| **F208** | SEO/메타데이터 개선       | Must     | v1.2c | 코드베이스 분석                        |
| **F209** | 에러 바운더리 보완        | Should   | v1.2c | 코드베이스 분석                        |
| **F210** | 성능 최적화               | Should   | v1.2c | 코드베이스 분석                        |
| **F202** | 이메일 뉴스 다이제스트    | Should   | v1.2d | 기존 PRD                               |
| **F203** | 뉴스 트렌드               | Should   | v1.2d | 기존 PRD                               |
| **F211** | Naver 소셜 로그인         | Should   | v1.2d | v1.1 이관 항목                         |
| **F205** | PWA 지원                  | Could    | 미정  | 기존 PRD                               |
| **F204** | 해외 뉴스 RSS             | Could    | 미정  | 기존 PRD                               |

### 권장 구현 단계

| 단계  | 포함 기능        | 핵심 목표                                  |
| ----- | ---------------- | ------------------------------------------ |
| v1.2a | F200, F206       | 뉴스 시스템 대폭 개편 + 날씨 위치 개선     |
| v1.2b | F201, F207       | 빠른 메모 + 선호 카테고리 개인화 실제 활용 |
| v1.2c | F208, F209, F210 | 품질 개선 (SEO, 에러 처리, 성능)           |
| v1.2d | F202, F203, F211 | 알림 + 트렌드 + Naver 로그인               |

---

### F200: 뉴스 내용정리 시스템 개편 (Must)

**문제**: AI 요약이 "한줄 요약" 수준의 팩트 불릿 포인트만 추출함. 관리자/사용자 모두 정리된 기사 형태를 원함. 현재 `scripts/summarizer.ts`에서 title + description만 입력하며 본문 미포함.

**목표**: AI가 그룹 내 기사들을 종합하여 실제 기사처럼 서술형으로 작성 (객관적 정보만).

**파이프라인 변경**:

1. RSS 수집 후 기존 pg_trgm 그룹핑에 더해 Ollama 기반 의미론적 유사도 보완 검토
2. 그룹별로 AI가 제목 + 본문 전체를 입력받아 실제 기사 형식으로 서술형 작성
3. 원본 기사는 "관련 기사 링크"로만 남기고 수집 본문 데이터 정리

**영향 파일**:

| 파일                                    | 변경 내용                          |
| --------------------------------------- | ---------------------------------- |
| `scripts/summarizer.ts`                 | 프롬프트 전면 교체, 본문 입력 추가 |
| `scripts/worker.ts`                     | 기사 본문 조회 로직 추가           |
| `lib/news/queries.ts`                   | 서술형 요약 조회 지원              |
| `components/news/fact-summary-card.tsx` | 서술형 렌더링으로 변경             |
| `supabase/migrations/`                  | fact_summary 컬럼 타입/제약 검토   |

---

### F201: 빠른 메모 (Must)

**문제**: 대시보드에 빠른 메모 기능이 없어 외부 앱 의존.

**목표**: 대시보드에서 즉시 메모 작성/관리. 마크다운 지원, 핀 기능.

**데이터 모델**:

```sql
create table memos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  content text not null,
  is_pinned boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

**영향 파일**: `app/protected/memos/`, `components/memos/`, `api/memos/`, 마이그레이션 파일

---

### F202: 이메일 뉴스 다이제스트 (Should)

**문제**: `email_digest_enabled` 컬럼이 DB에 존재하나 UI 미구현 상태 (데드 코드).

**목표**: 사용자가 선택한 시간에 관심 카테고리 뉴스 요약을 이메일로 발송. 설정 페이지에서 활성화/빈도 설정.

**구현 방향**: Supabase Edge Function + Resend (이메일 서비스) 조합. Vercel Cron으로 트리거.

---

### F203: 뉴스 트렌드 (Should)

**문제**: 시간대별/카테고리별 뉴스 동향 파악 불가.

**목표**: 기간별 인기 키워드 시각화, 카테고리 분포 트렌드, 뉴스 볼륨 그래프.

**구현 방향**: 기존 Recharts 인프라 활용. 관리자 대시보드의 차트 패턴 재사용.

---

### F204: 해외 뉴스 RSS (Could)

**목표**: 영어권 주요 언론사 (BBC, Reuters 등) RSS 피드 추가. 언어 필터 기능.

---

### F205: PWA 지원 (Could)

**목표**: `next-pwa` 또는 직접 Service Worker 구현. 오프라인 캐시, 홈 화면 추가.

---

### F206: 날씨 위치 설정 개선 (Must)

**문제**: 기본값이 "서울" (`lib/weather/locations.ts` DEFAULT_LOCATION)이라 설정 미변경 사용자는 항상 서울 날씨를 봄. 신규 사용자가 설정 변경을 모를 수 있음. 야간 아이콘 미구분.

**목표**:

- 최초 방문 시 브라우저 Geolocation으로 가장 가까운 시/도 자동 추천
- 날씨 위젯/페이지에서 직접 위치 변경 드롭다운 추가 (설정 페이지 이동 불필요)
- 야간 아이콘 분리 (`lib/weather/icons.ts`에서 `01n` → Moon 등)

**영향 파일**:

| 파일                                      | 변경 내용                          |
| ----------------------------------------- | ---------------------------------- |
| `lib/weather/locations.ts`                | 기본값 제거, Geolocation 유틸 추가 |
| `lib/weather/icons.ts`                    | 야간 아이콘 매핑 추가              |
| `components/weather/weather-widget.tsx`   | 위치 변경 드롭다운 추가            |
| `app/protected/weather/page.tsx`          | 인라인 위치 변경 UI                |
| `components/settings/widget-settings.tsx` | 날씨 위치 설정 통합                |

---

### F207: 선호 카테고리 실제 활용 (Must)

**문제**: `user_preferences.preferred_categories`가 설정 페이지에서 저장 가능하지만, 뉴스 목록(`app/protected/news/page.tsx`)과 대시보드(`news-dashboard-section.tsx`)에서 **전혀 사용되지 않음**. 사실상 데드 코드.

**목표**:

- 대시보드 뉴스 섹션: 선호 카테고리 기반 뉴스 우선 표시
- 뉴스 페이지: 선호 카테고리를 기본 활성 탭으로 설정 (설정된 경우)
- 뉴스 없을 때 선호 카테고리 기반 추천 메시지

**영향 파일**:

| 파일                                         | 변경 내용                          |
| -------------------------------------------- | ---------------------------------- |
| `lib/user/preferences.ts`                    | getCachedUserPreferences 함수 추가 |
| `app/protected/news/page.tsx`                | 선호 카테고리 기반 기본 탭 설정    |
| `components/news/news-dashboard-section.tsx` | 선호 카테고리 필터링 로직 추가     |
| `components/news/news-empty-state.tsx`       | 선호 카테고리 기반 메시지 개선     |

---

### F208: SEO/메타데이터 개선 (Must)

**문제**: 현재 프로젝트에 favicon, robots.txt, sitemap.xml, Open Graph 메타데이터가 모두 없음. 뉴스 상세 페이지는 정적 title("뉴스 상세 | Lifeboard")만 사용.

**목표**:

- `favicon.ico` 및 `apple-touch-icon` 추가
- `app/robots.ts` 추가 (인증 필요 페이지 크롤링 방지: `/protected/*`, `/admin/*`)
- `app/sitemap.ts` 추가 (공개 페이지: `/`, `/auth/login`)
- 홈 페이지에 Open Graph / Twitter Card 메타데이터
- 뉴스 상세 페이지에 `generateMetadata` 적용 (동적 title + description)
- 대시보드, 로그인, 관리자 페이지에 정적 metadata 추가

**영향 파일**:

| 파일                                    | 변경 내용                        |
| --------------------------------------- | -------------------------------- |
| `app/layout.tsx`                        | 기본 metadata 개선, favicon 참조 |
| `app/page.tsx`                          | Open Graph / Twitter Card 추가   |
| `app/robots.ts`                         | 신규 생성                        |
| `app/sitemap.ts`                        | 신규 생성                        |
| `app/protected/news/[groupId]/page.tsx` | generateMetadata 추가            |
| `public/favicon.ico`                    | 신규 추가                        |

---

### F209: 에러 바운더리 보완 (Should)

**문제**: `/admin/*`, `/protected` 대시보드, `/protected/settings`에 `error.tsx`가 없음. 관리자 페이지 에러 발생 시 전체 앱 중단 가능.

**목표**:

- `app/admin/error.tsx` 추가
- `app/protected/error.tsx` 추가
- `app/protected/settings/error.tsx` 추가
- 날씨 위젯 에러 시 조용히 사라지는 대신 안내 메시지 표시

**기존 패턴 참고**: `app/protected/news/error.tsx`

---

### F210: 성능 최적화 (Should)

**문제**: 여러 곳에서 `getUser()` (Supabase 서버 HTTP 요청)을 `getClaims()` (로컬 JWT 파싱)로 대체 가능. 설정 페이지에서 중복 API 호출 발생.

**목표**:

- `news-dashboard-section.tsx`, `news/page.tsx`, `news/[groupId]/page.tsx`에서 `getUser()` → `getClaims()` (`.sub` 사용)
- `settings-content.tsx`에서 이중 인증 호출 최적화
- `widget-settings.tsx`에서 부모 Server Component 데이터를 props로 전달 (마운트 후 중복 GET 요청 제거)

**영향 파일**:

| 파일                                            | 변경 내용                         |
| ----------------------------------------------- | --------------------------------- |
| `components/news/news-dashboard-section.tsx:18` | getUser() → getClaims().sub       |
| `app/protected/news/page.tsx:37`                | getUser() → getClaims().sub       |
| `components/settings/widget-settings.tsx:38~54` | 부모 props 수신으로 중복 GET 제거 |

---

### F211: Naver 소셜 로그인 (Should)

**문제**: Naver는 OIDC 미지원으로 Supabase 네이티브 방식 불가. v1.1에서 이관됨.

**목표**: Supabase Edge Function을 통한 커스텀 OAuth 2.0 → JWT 토큰 교환 구현.

**구현 방향**:

1. Naver OAuth 2.0 인증 코드 수신 Edge Function
2. Naver 사용자 정보 조회 → Supabase admin.createUser() 또는 기존 계정 연결
3. 커스텀 JWT 발급 → 클라이언트 세션 설정

**영향 파일**: `components/social-login-buttons.tsx`, `app/auth/callback/route.ts`, Supabase Edge Function 신규

---

## v2.0 기능 명세 (장기 비전)

| ID       | 기능명                    | 설명                                                      |
| -------- | ------------------------- | --------------------------------------------------------- |
| **F300** | 메슬로 욕구단계 분류 체계 | 라이프 데이터 전체를 인간 욕구 5단계로 재분류 (하단 상세) |
| **F301** | 일정 관리                 | 캘린더 뷰, Google Calendar 연동                           |
| **F302** | 할일 목록                 | 태그/우선순위/반복 설정, 대시보드 위젯                    |
| **F303** | 재무 추적                 | 지출 카테고리, 월별 집계, 목표 설정                       |
| **F304** | 건강 데이터               | 걸음 수/수면/운동 기록, Apple Health / Google Fit 연동    |
| **F305** | 접근성 대폭 개선          | Skip navigation, 시맨틱 구조 전면 검토, WCAG 2.1 AA 목표  |
| **F306** | 에러 모니터링 서비스      | Sentry 등 외부 서비스 통합, 알림 연동                     |

### F300: 메슬로 욕구단계 기반 분류 체계

**배경**: 현재 대시보드는 뉴스, 날씨 등 개별 위젯이 나열되어 있을 뿐, 라이프 데이터 전체를 아우르는 상위 분류 체계가 없다. 라이프보드의 정체성에 맞게 **인간의 욕구 중심**으로 대시보드의 모듈/위젯 배치 구조를 재설계한다. 뉴스 카테고리(정치/경제/사회 등)는 뉴스 모듈 내부 분류로 그대로 유지.

**제안 분류 체계**:

| 욕구 단계   | 서비스 분야                                  |
| ----------- | -------------------------------------------- |
| 생리적 욕구 | 건강, 음식, 수면, 운동                       |
| 안전 욕구   | 재무, 날씨, 뉴스 (사회/경제/세계), 할일/일정 |
| 소속/애정   | 소셜, 커뮤니티, 관계                         |
| 존중 욕구   | 성취, 커리어, 학습                           |
| 자아실현    | 창작, 독서, 자기계발                         |

---

## 데이터 모델

### 현재 테이블

| 테이블                | 설명                                                                            |
| --------------------- | ------------------------------------------------------------------------------- |
| `news_sources`        | RSS 피드 소스 (언론사명, 피드 URL, 카테고리, 활성 여부)                         |
| `news_article_groups` | 유사 기사 그룹 (대표 기사, fact_summary, 카테고리, is_valid 품질 플래그)        |
| `news_articles`       | 개별 기사 (제목, URL, 소스, 그룹 연결, is_deleted soft delete)                  |
| `news_fetch_logs`     | 수집 로그 (소스별 성공/실패, 수집 개수, filtered_count)                         |
| `summarize_jobs`      | AI 요약 작업 큐 (상태: pending/processing/completed/failed)                     |
| `content_filters`     | 콘텐츠 필터링 규칙 (블랙리스트/화이트리스트 키워드)                             |
| `user_preferences`    | 사용자 설정 (preferred_categories, dashboard_config JSONB, weather_location)    |
| `user_bookmarks`      | 사용자 북마크 (뉴스 그룹 ID, 최대 100개 제한)                                   |
| `admin_audit_logs`    | 관리자 행위 감사 로그 (admin_id, action, target_type, target_id, details JSONB) |

### RPC 함수 (service_role 전용)

| 함수명                        | 설명                                               |
| ----------------------------- | -------------------------------------------------- |
| `find_similar_group`          | 트라이그램 유사도 기반 그룹 검색                   |
| `increment_article_count`     | 그룹 기사 수 갱신                                  |
| `cleanup_old_records`         | 오래된 로그/작업 자동 정리                         |
| `enqueue_summarize_jobs`      | 요약 작업 일괄 등록                                |
| `get_top_articles_for_groups` | 그룹별 상위 N개 기사 조회 (윈도우 함수)            |
| `batch_group_articles`        | 배치 그룹핑 (유사도 0.5, 72시간 범위)              |
| `get_user_bookmarks`          | 북마크 목록 조회 (JOIN으로 뉴스 그룹 정보 포함)    |
| `search_news_groups`          | 뉴스 검색 (pg_trgm 유사도 기반, 제목 및 요약 검색) |

### v1.2 신규 테이블 (예정)

| 테이블  | 설명                                           |
| ------- | ---------------------------------------------- |
| `memos` | 사용자 빠른 메모 (content, is_pinned, user_id) |

---

## 메뉴 구조 (현재)

```
[헤더]
  ├─ 로고 (Lifeboard)
  ├─ [데스크톱 네비게이션]
  │    ├─ 대시보드 (/protected)
  │    ├─ 뉴스 (/protected/news)
  │    └─ 설정 (/protected/settings)
  ├─ [ThemeSwitcher]
  └─ [AuthButton] → 사용자 아바타/이름 + 로그아웃

[모바일 네비게이션 (Sheet)]
  ├─ 대시보드
  ├─ 뉴스
  └─ 설정

[관리자 사이드바 /admin/*] (별도 레이아웃)
  ├─ 대시보드 (/admin)
  ├─ 뉴스 관리 (/admin/news)
  ├─ 콘텐츠 모더레이션 (/admin/moderation)
  ├─ 사용자 관리 (/admin/users)
  └─ 시스템 모니터링 (/admin/monitoring)
```

---

## 뉴스 수집 파이프라인 (현재)

| 단계        | 담당                       | 세부 내용                                            |
| ----------- | -------------------------- | ---------------------------------------------------- |
| 트리거      | Vercel Cron                | 하루 2회 (KST 8시/20시 = UTC 23시/11시), vercel.json |
| 수집        | /api/news/collect          | rss-parser, 20+ 언론사 RSS 피드                      |
| 필터링      | content-filter.ts          | content_filters 테이블 블랙리스트/화이트리스트       |
| 중복 제거   | URL 기반 unique 제약       | INSERT-first + 23505 에러 핸들링                     |
| 그룹핑      | batch_group_articles RPC   | 유사도 0.5, 72시간 범위, pg_trgm                     |
| 요약 등록   | enqueue_summarize_jobs RPC | 그룹별 summarize_jobs 큐 INSERT                      |
| 캐시 무효화 | revalidateTag              | 뉴스 캐시 태그 무효화                                |
| AI 요약     | Ollama PC 워커             | qwen2.5:14b, 한국어 품질 검증 (한글 70% 기준)        |
| 캐시        | use cache                  | 30분 캐시, 서버 컴포넌트 데이터 페칭                 |

---

## 환경 변수

| 변수명                                 | 필수 | 설명                                                   |
| -------------------------------------- | ---- | ------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`             | 필수 | Supabase 프로젝트 URL                                  |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 필수 | Supabase anon key (공개)                               |
| `SUPABASE_SERVICE_ROLE_KEY`            | 필수 | service_role 키 (서버 전용, 절대 클라이언트 노출 금지) |
| `CRON_SECRET`                          | 필수 | API Route 인증용 (Vercel Cron 자동 포함)               |
| `WEATHER_API_KEY`                      | 선택 | OpenWeatherMap API 키, 미설정 시 날씨 위젯 숨김        |
| `SLACK_WEBHOOK_URL`                    | 선택 | Slack 알림 훅 URL                                      |
| `TEST_USER_EMAIL`                      | 로컬 | E2E 테스트 계정 이메일                                 |
| `TEST_USER_PASSWORD`                   | 로컬 | E2E 테스트 계정 비밀번호                               |

---

## 우선순위 매트릭스 (v1.2)

| 기능                    | 영향도 | 구현 난이도 | 우선순위 |
| ----------------------- | ------ | ----------- | -------- |
| F200 뉴스 시스템 개편   | 높음   | 높음        | Must     |
| F206 날씨 위치 개선     | 중간   | 낮음        | Must     |
| F207 선호 카테고리 활용 | 중간   | 낮음        | Must     |
| F208 SEO/메타데이터     | 높음   | 낮음        | Must     |
| F201 빠른 메모          | 높음   | 중간        | Must     |
| F209 에러 바운더리      | 중간   | 낮음        | Should   |
| F210 성능 최적화        | 중간   | 낮음        | Should   |
| F211 Naver 로그인       | 중간   | 높음        | Should   |
| F202 이메일 다이제스트  | 중간   | 중간        | Should   |
| F203 뉴스 트렌드        | 낮음   | 중간        | Should   |
| F205 PWA                | 낮음   | 중간        | Could    |
| F204 해외 뉴스          | 낮음   | 낮음        | Could    |

---

## 변경 이력

| 버전 | 날짜       | 내용                                                                                                                                                                  |
| ---- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v1.0 | 2026-02-16 | 초안 작성 (MVP Phase 0~5 완료 기준)                                                                                                                                   |
| v2.0 | 2026-02-16 | v1.1 기능 명세 추가 (F100~F125), 아키텍처 업데이트                                                                                                                    |
| v2.4 | 2026-02-16 | 관리자 시스템 상세 명세 (F120~F125), 데이터 모델 업데이트                                                                                                             |
| v3.0 | 2026-02-18 | v1.1d 완료 기준으로 전면 재작성. v1.1 상세 명세 아카이브 이동. v1.2 기능 명세 신규 작성 (F200~F211). ISSUE.md 반영 (F200, F206). 메슬로 욕구단계 분류 v2.0 비전 추가. |

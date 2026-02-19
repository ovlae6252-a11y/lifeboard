# Lifeboard (라이프보드) - 개발 로드맵

## 개요

라이프보드는 인생의 모든 데이터를 한눈에 볼 수 있는 통합 대시보드 웹 애플리케이션이다. MVP(v1.0, Phase 0~5)가 2026-02-16에, v1.1(a~d)이 2026-02-18에 완료되어 프로덕션 운영 중이다. 이전 버전 로드맵은 `docs/complete/` 디렉토리에서 확인할 수 있다.

이 로드맵은 `docs/PRD.md`(v3.0, 2026-02-18)를 기반으로 작성되었으며, v1.2 구현에 집중한다. v1.2는 뉴스 콘텐츠 품질 개선, 개인화 기능 실제 활용, 시스템 안정성(SEO, 에러 처리, 성능) 강화를 목표로 하며 v1.2a~d 4단계로 점진적 배포한다.

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
| 날씨 API              | OpenWeatherMap           | Free tier, 30분 캐시                                    |
| RSS 파싱              | rss-parser               | npm 패키지                                              |
| 차트                  | Recharts                 | 관리자 대시보드 + v1.2d 트렌드                          |
| 이메일                | Resend                   | v1.2d 이메일 다이제스트 (신규)                          |
| 배포                  | Vercel                   | Cron 작업, Speed Insights                               |
| 코드 품질             | ESLint + Prettier        | Husky + lint-staged (pre-commit)                        |
| E2E 테스트            | Playwright               | auth setup 패턴                                         |

## 아키텍처 개요

### 현재 아키텍처 (v1.1d)

```
[Vercel Cron 하루 2회 (KST 08:00, 20:00)]
  |
  v
[/api/news/collect]
  |-- RSS 파싱 (rss-parser)
  |-- 콘텐츠 필터링 (content-filter.ts)
  |-- 중복 필터링 → DB INSERT → [news_articles]
  |-- 배치 그룹핑 RPC (batch_group_articles)
  |-- 요약 작업 등록 RPC → [summarize_jobs]
  |-- 캐시 무효화 (revalidateTag)
  v
[Ollama PC 워커 (scripts/)]
  Realtime + 30초 폴링 → pending 감지 → 팩트 추출 → 한국어 검증
  v
[Supabase DB] → [Next.js 웹앱] use cache + admin 클라이언트
[OpenWeatherMap API] → lib/weather/api.ts "use cache" 30분 캐시
[proxy.ts] → 세션 갱신 + 미인증/관리자 리다이렉트
```

### v1.2 아키텍처 확장

- **뉴스 서술형 요약** (v1.2a): Ollama 프롬프트 교체 (불릿 -> 서술형 마크다운)
- **날씨 Geolocation** (v1.2a): 브라우저 위치 API + Haversine 거리 → 자동 시/도 추천
- **빠른 메모** (v1.2b): `memos` 테이블 + RLS + CRUD API + 대시보드 위젯
- **개인화** (v1.2b): 선호 카테고리 기반 뉴스 필터링/리다이렉트
- **SEO** (v1.2c): robots.ts, sitemap.ts, Open Graph, generateMetadata
- **이메일 다이제스트** (v1.2d): Resend + Vercel Cron → 선호 카테고리 뉴스 발송
- **뉴스 트렌드** (v1.2d): 키워드 빈도 집계 + Recharts 시각화

---

## 개발 단계

### v1.2a: 뉴스 서술형 전환 + 날씨 위치 개선

**목표:** AI 뉴스 요약을 불릿 포인트에서 서술형 마크다운으로 전환하고, 날씨 위치 설정을 Geolocation 자동 추천 + 인라인 드롭다운으로 개선한다.
**완료 기준:** 새로 생성되는 뉴스 요약이 2~3 문단 서술형으로 렌더링되고, 날씨 위젯에서 직접 위치를 변경할 수 있으며, 최초 방문 시 Geolocation 기반 위치가 자동 추천된다.

#### 마일스톤 1.2a.1: 뉴스 서술형 요약 전환 (F200)

> Ollama 워커 프롬프트를 먼저 교체한 뒤, 프론트엔드 렌더링을 변경한다. 기존 불릿 포인트 요약 데이터는 react-markdown이 호환 처리하므로 하위 호환성이 유지된다.

- [ ] 태스크 1.2a.1.1: `scripts/summarizer.ts` 프롬프트 전면 교체 (불릿 -> 서술형)
  - 상세: 기존 팩트 추출 프롬프트를 서술형 작성 프롬프트로 교체. "그룹 내 기사들의 정보를 종합하여 2~3 문단의 서술형 마크다운으로 작성하세요. 불릿 포인트 사용 금지. 객관적 정보만 포함." 한국어 강제 지시문 유지. `ArticleForSummary` 타입 변경 없음 (title + description 입력 유지).
  - 관련 파일: `scripts/summarizer.ts`

- [ ] 태스크 1.2a.1.2: `fact-summary-card.tsx` 렌더링 방식 변경 (parseFacts 제거)
  - 상세: `parseFacts()` 호출 제거. `fact_summary` 전체를 `react-markdown` + `remark-gfm`으로 직접 렌더링. 기존 `MarkdownFact` 컴포넌트 패턴 참고. 불릿 포인트 스타일 대신 일반 본문(prose) 스타일 적용. 제목 아이콘을 "팩트 체크" 에서 "뉴스 요약" 등으로 변경 검토.
  - 관련 파일: `components/news/fact-summary-card.tsx`

- [ ] 태스크 1.2a.1.3: `news-group-card.tsx` 요약 미리보기 조정
  - 상세: 카드 내 요약 미리보기가 있다면 서술형 첫 문장만 표시하도록 변경 (plain text 변환 후 truncate). 현재 카드가 제목 + 카테고리 + 기사 수만 표시한다면 변경 불필요 (확인 후 결정).
  - 관련 파일: `components/news/news-group-card.tsx`

- [ ] 태스크 1.2a.1.4: `lib/utils/parse-facts.ts` 미사용 확인 및 제거
  - 상세: 프로젝트 전체에서 `parseFacts` import를 검색하여 미사용 확인. 미사용 시 파일 삭제. 사용처가 남아있다면 해당 파일도 서술형 대응으로 수정.
  - 관련 파일: `lib/utils/parse-facts.ts`

- [ ] 태스크 1.2a.1.5: Playwright MCP 테스트 - 뉴스 서술형 요약 렌더링
  - 사전 조건: 태스크 1.2a.1.1 ~ 1.2a.1.4 완료, Ollama 워커가 새 프롬프트로 요약 생성 완료된 데이터 존재
  - 검증 항목:
    1. `browser_navigate`로 `/protected/news` 접근 -> 뉴스 목록 정상 로드
    2. `browser_click`으로 뉴스 카드 클릭 -> 상세 페이지 이동
    3. `browser_snapshot`으로 상세 페이지에 서술형 요약 문단 존재 확인 (불릿 포인트 아닌 본문 형태)
    4. `browser_console_messages`로 에러 없음 확인
  - 결과: 뉴스 상세 페이지 스크린샷 저장 (`browser_take_screenshot`)

#### 마일스톤 1.2a.2: 날씨 위치 설정 개선 (F206)

> 유틸리티 함수를 먼저 구현한 뒤, 위젯 분리(Client 래퍼 + Server 콘텐츠) -> 위치 선택 UI -> 통합 순서로 진행한다.

- [ ] 태스크 1.2a.2.1: `lib/weather/locations.ts`에 Geolocation 유틸리티 함수 추가
  - 상세: `findNearestLocation(lat: number, lng: number): LocationKey` 함수 추가. 기존 `LOCATIONS` 맵의 각 도시 좌표와 Haversine 거리를 계산하여 가장 가까운 시/도 반환. `LOCATIONS` 객체에 각 도시별 위도/경도 좌표 추가.
  - 관련 파일: `lib/weather/locations.ts`

- [ ] 태스크 1.2a.2.2: `lib/weather/icons.ts` 야간 아이콘 매핑 추가
  - 상세: OpenWeatherMap의 야간 아이콘 코드(`01n`, `02n`, `03n`, `04n`, `09n`, `10n`, `11n`, `13n`, `50n`)에 대응하는 Lucide 아이콘 매핑 추가. 예: `01n` -> Moon, `02n` -> CloudMoon. 기존 주간 매핑과 별도 또는 통합 매핑 객체로 구성.
  - 관련 파일: `lib/weather/icons.ts`

- [ ] 태스크 1.2a.2.3: `weather-widget.tsx` Client 래퍼 + Server 콘텐츠 분리
  - 상세: 현재 async Server Component인 `weather-widget.tsx`를 두 컴포넌트로 분리. (1) `WeatherWidgetWrapper` (Client Component): 위치 선택 상태 관리, `router.refresh()` 호출. (2) `WeatherWidgetContent` (Server Component): 기존 날씨 데이터 페칭 + 렌더링 유지. 에러 시 `return null` 대신 안내 UI 반환 (F209 선행 적용).
  - 관련 파일: `components/weather/weather-widget.tsx`

- [ ] 태스크 1.2a.2.4: `weather-location-select.tsx` 위치 선택 드롭다운 구현
  - 상세: Client Component. shadcn/ui `Select` 또는 `Combobox` 기반. `LOCATIONS` 맵의 도시 목록을 드롭다운 옵션으로 표시. 선택 시 `fetch('/api/user/preferences', { method: 'PUT', body: { weather_location } })` 호출. Geolocation 자동 추천: `navigator.geolocation.getCurrentPosition()` -> `findNearestLocation()` -> 현재 설정과 다르면 Toast로 추천 ("현재 위치 기반으로 '{도시명}'(으)로 변경하시겠습니까?"). Geolocation 권한 거부 시 조용히 무시.
  - 관련 파일: `components/weather/weather-location-select.tsx` (신규)

- [ ] 태스크 1.2a.2.5: `/protected/weather/page.tsx` 인라인 위치 변경 UI 통합
  - 상세: 날씨 상세 페이지 상단에 `WeatherLocationSelect` 드롭다운 배치. 현재 선택된 위치 표시. 위치 변경 시 페이지 리프레시로 새 날씨 데이터 반영.
  - 관련 파일: `app/protected/weather/page.tsx`

- [ ] 태스크 1.2a.2.6: `widget-settings.tsx` 위치 설정 통합 (중복 제거)
  - 상세: 기존 설정 페이지의 날씨 위치 드롭다운과 `WeatherLocationSelect` 컴포넌트를 공용화. 설정 페이지에서도 동일한 컴포넌트 사용. 중복 로직 제거.
  - 관련 파일: `components/settings/widget-settings.tsx`

- [ ] 태스크 1.2a.2.7: Playwright MCP 테스트 - 날씨 위치 설정 개선
  - 사전 조건: 태스크 1.2a.2.1 ~ 1.2a.2.6 완료
  - 검증 항목:
    1. `browser_navigate`로 `/protected` 접근 -> 날씨 위젯에 위치 선택 드롭다운 존재 확인
    2. `browser_snapshot`으로 현재 위치명 표시 확인
    3. `browser_click`으로 위치 드롭다운 열기 -> 도시 목록 표시 확인
    4. `browser_click`으로 다른 도시 선택 -> `browser_network_requests`로 `/api/user/preferences` PUT 호출 확인
    5. `browser_navigate`로 `/protected/weather` 접근 -> 인라인 위치 변경 UI 존재 확인
    6. `browser_snapshot`으로 야간 시간대에 야간 아이콘 표시 확인 (시간대에 따라 조건부)
    7. `browser_console_messages`로 에러 없음 확인
  - 결과: 대시보드 날씨 위젯 + 날씨 상세 페이지 스크린샷 저장

---

### v1.2b: 빠른 메모 + 선호 카테고리 개인화

**목표:** 대시보드에 빠른 메모 위젯을 추가하고, 기존에 저장만 되던 선호 카테고리를 뉴스 목록과 대시보드에서 실제로 활용한다.
**완료 기준:** 대시보드에서 메모를 작성/수정/삭제/핀 고정할 수 있고, 뉴스 페이지 접근 시 선호 카테고리가 기본 탭으로 활성화되며, 대시보드 뉴스 섹션이 선호 카테고리 기반으로 필터링된다.

#### 마일스톤 1.2b.1: 메모 백엔드 (F201 - DB + API)

> DB 스키마와 API를 먼저 구축하여, 프론트엔드 작업 시 데이터 계층이 준비되도록 한다. RLS 정책은 마이그레이션에 반드시 포함한다.

- [ ] 태스크 1.2b.1.1: `memos` 테이블 + RLS + 인덱스 마이그레이션
  - 상세: PRD F201의 SQL 정의 그대로 적용. `id UUID PK`, `user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL`, `content TEXT NOT NULL CHECK(char_length(content) <= 5000)`, `is_pinned BOOLEAN DEFAULT false`, `created_at TIMESTAMPTZ DEFAULT now()`, `updated_at TIMESTAMPTZ DEFAULT now()`. RLS 4개 정책 (본인 조회/삽입/수정/삭제). 인덱스 2개 (`idx_memos_user_id`, `idx_memos_pinned`).
  - 관련 파일: `supabase/migrations/[timestamp]_create_memos_table.sql`

- [ ] 태스크 1.2b.1.2: `database.types.ts` 재생성
  - 상세: `npx supabase gen types typescript --project-id <project-id> > lib/supabase/database.types.ts` 실행. `memos` 테이블 타입이 포함되었는지 확인.
  - 관련 파일: `lib/supabase/database.types.ts`

- [ ] 태스크 1.2b.1.3: `/api/memos/route.ts` 메모 CRUD API 구현
  - 상세: GET (목록 조회, pinned 우선 + updated_at DESC 정렬), POST (생성, 사용자당 50개 제한 검증), PUT (수정, content/is_pinned 업데이트, updated_at 갱신), DELETE (삭제). 모든 핸들러에서 `getClaims()` 인증 확인. Supabase RLS가 자동으로 user_id 필터링하므로 서버 클라이언트 사용. 에러 응답: 프로덕션은 일반 메시지, 개발은 상세 메시지.
  - 관련 파일: `app/api/memos/route.ts` (신규)

- [ ] 태스크 1.2b.1.4: Playwright MCP 테스트 - 메모 API 엔드포인트
  - 사전 조건: 태스크 1.2b.1.1 ~ 1.2b.1.3 완료
  - 검증 항목:
    1. `browser_navigate`로 `/protected` 접근 (인증 상태)
    2. `browser_network_requests`로 `/api/memos` GET 호출 성공 확인 (200 응답)
    3. `browser_console_messages`로 에러 없음 확인
  - 결과: 네트워크 요청 로그 확인

#### 마일스톤 1.2b.2: 메모 프론트엔드 (F201 - 위젯 + 편집기)

- [ ] 태스크 1.2b.2.1: `memo-editor.tsx` 메모 편집 컴포넌트 구현
  - 상세: Client Component. shadcn/ui `Textarea` + `Button` 조합. 마크다운 입력 지원 (미리보기 토글: 입력/렌더링 전환). 마크다운 렌더링은 기존 `react-markdown` + `remark-gfm` 재사용. 글자 수 카운터 (5,000자 제한). 저장/취소 버튼. 핀 토글 버튼 (lucide `Pin`/`PinOff`).
  - 관련 파일: `components/memos/memo-editor.tsx` (신규)

- [ ] 태스크 1.2b.2.2: `memo-widget.tsx` 대시보드용 메모 위젯 구현
  - 상세: Client Component. 메모 목록 표시 (pinned 우선, 최대 5개 미리보기). 각 메모: 내용 2줄 truncate + 핀 아이콘 + 상대시간. "새 메모" 버튼 -> 인라인 `MemoEditor` 표시. 메모 클릭 -> 인라인 편집 모드. 삭제 버튼 (확인 다이얼로그). 낙관적 UI 업데이트 (생성/수정/삭제). shadcn/ui `Card` 기반, 뉴스/날씨 위젯과 동일한 높이/스타일.
  - 관련 파일: `components/memos/memo-widget.tsx` (신규)

- [ ] 태스크 1.2b.2.3: `app/protected/page.tsx` 대시보드에 메모 위젯 섹션 추가
  - 상세: 기존 `DashboardContent` 컴포넌트에 메모 위젯 추가. `dashboard_config.showMemos` 토글에 따라 표시/숨김. 위젯 배치 순서: 날씨 -> 뉴스 -> 메모 (또는 레이아웃에 따라 조정).
  - 관련 파일: `app/protected/page.tsx`

- [ ] 태스크 1.2b.2.4: `widget-settings.tsx`에 showMemos 토글 추가
  - 상세: 기존 뉴스/날씨 위젯 토글 아래에 "메모 위젯" 토글 추가. `dashboard_config` JSONB에 `showMemos: boolean` (기본값 true) 추가. 기존 토글 패턴 그대로 재사용.
  - 관련 파일: `components/settings/widget-settings.tsx`

- [ ] 태스크 1.2b.2.5: Playwright MCP 테스트 - 빠른 메모 위젯 전체 흐름
  - 사전 조건: 태스크 1.2b.2.1 ~ 1.2b.2.4 완료
  - 검증 항목:
    1. `browser_navigate`로 `/protected` 접근 -> 메모 위젯 섹션 존재 확인
    2. `browser_snapshot`으로 "새 메모" 버튼 존재 확인
    3. `browser_click`으로 "새 메모" 클릭 -> 편집기 UI 표시 확인
    4. `browser_type`으로 메모 내용 입력 -> 저장 버튼 클릭
    5. `browser_network_requests`로 `/api/memos` POST 호출 성공 확인
    6. `browser_snapshot`으로 저장된 메모가 목록에 표시되는지 확인
    7. `browser_click`으로 핀 토글 -> 핀 상태 변경 확인
    8. `browser_navigate`로 `/protected/settings` 접근 -> 메모 위젯 토글 존재 확인
    9. `browser_console_messages`로 에러 없음 확인
  - 결과: 대시보드 메모 위젯 스크린샷 저장

#### 마일스톤 1.2b.3: 선호 카테고리 실제 활용 (F207)

- [ ] 태스크 1.2b.3.1: `news/page.tsx` 선호 카테고리 기본 탭 리다이렉트
  - 상세: `searchParams`에 `category` 파라미터가 없고, 사용자의 `preferred_categories`가 설정되어 있으면 `redirect(`/protected/news?category=${preferredCategories[0]}`)` 실행. `getClaims()`로 userId 확인 후 `user_preferences` 조회. `searchParams`에 `category`가 이미 있으면 리다이렉트 하지 않음 (사용자의 명시적 선택 존중).
  - 관련 파일: `app/protected/news/page.tsx`

- [ ] 태스크 1.2b.3.2: `news-dashboard-section.tsx` 선호 카테고리 필터링 적용
  - 상세: `preferredCategories: string[]` prop 추가. 선호 카테고리가 설정되어 있으면 첫 번째 카테고리로 `getNewsGroups({ category, limit: 6 })` 호출. 미설정 시 기존 동작 유지 (전체 최신 뉴스 6개). 섹션 제목에 카테고리명 표시 (예: "경제 뉴스" vs "최신 뉴스").
  - 관련 파일: `components/news/news-dashboard-section.tsx`

- [ ] 태스크 1.2b.3.3: `app/protected/page.tsx`에서 preferredCategories props 전달
  - 상세: `DashboardContent` Server Component에서 이미 `user_preferences`를 조회하므로, `preferred_categories` 값을 `NewsDashboardSection`에 props로 전달.
  - 관련 파일: `app/protected/page.tsx`

- [ ] 태스크 1.2b.3.4: `news-empty-state.tsx` 선호 카테고리 기반 메시지 개선
  - 상세: `preferredCategory?: string` prop 추가. 선호 카테고리 기반 메시지: "'{카테고리명}' 카테고리의 뉴스가 아직 없습니다. 다른 카테고리를 확인해 보세요." 기존 기본 메시지와 조건 분기.
  - 관련 파일: `components/news/news-empty-state.tsx`

- [ ] 태스크 1.2b.3.5: Playwright MCP 테스트 - 선호 카테고리 활용
  - 사전 조건: 태스크 1.2b.3.1 ~ 1.2b.3.4 완료, 테스트 사용자에 선호 카테고리 설정 필요
  - 검증 항목:
    1. `browser_navigate`로 `/protected/news` 접근 (category 파라미터 없이)
    2. `browser_snapshot`으로 URL에 `?category=` 파라미터가 추가되었는지 확인 (리다이렉트)
    3. `browser_snapshot`으로 해당 카테고리 탭이 활성 상태인지 확인
    4. `browser_navigate`로 `/protected` 접근 -> 대시보드 뉴스 섹션 제목에 카테고리명 포함 확인
    5. `browser_console_messages`로 에러 없음 확인
  - 결과: 뉴스 목록 + 대시보드 스크린샷 저장

---

### v1.2c: 품질 개선 (SEO, 에러 처리, 성능)

**목표:** SEO 기반 메타데이터를 추가하고, 누락된 에러 바운더리를 보완하며, 불필요한 API 호출을 제거하여 시스템 안정성과 성능을 높인다.
**완료 기준:** 홈/뉴스 상세 페이지에 Open Graph 메타데이터가 존재하고, 모든 주요 라우트에 에러 바운더리가 있으며, `getUser()` 호출이 `getClaims()`로 대체되어 불필요한 서버 왕복이 제거된다.

#### 마일스톤 1.2c.1: SEO/메타데이터 개선 (F208)

- [ ] 태스크 1.2c.1.1: `public/favicon.ico` 및 앱 아이콘 추가
  - 상세: Lifeboard 로고 기반 favicon.ico (16x16, 32x32) 생성. `public/` 디렉토리에 배치. 필요 시 `apple-touch-icon.png` (180x180)도 추가.
  - 관련 파일: `public/favicon.ico`, `public/apple-touch-icon.png` (신규)

- [ ] 태스크 1.2c.1.2: `app/layout.tsx` 기본 metadata 개선
  - 상세: `metadata` export에 `title.template`, `description`, `icons` (favicon 참조), `metadataBase` 추가. `title.default: "Lifeboard - 통합 라이프 대시보드"`, `title.template: "%s | Lifeboard"`. `description: "뉴스, 날씨, 메모 등 일상의 정보를 한눈에 관리하는 개인 대시보드"`.
  - 관련 파일: `app/layout.tsx`

- [ ] 태스크 1.2c.1.3: `app/page.tsx` Open Graph / Twitter Card 메타데이터 추가
  - 상세: 홈 페이지에 `openGraph` (title, description, type, url, images) + `twitter` (card, title, description) 메타데이터 추가. OG 이미지는 별도 생성하거나 기본 이미지 사용.
  - 관련 파일: `app/page.tsx`

- [ ] 태스크 1.2c.1.4: `app/robots.ts` 생성
  - 상세: Next.js의 `MetadataRoute.Robots` 타입 사용. `/protected/*`, `/admin/*`, `/api/*` 크롤링 방지 (Disallow). `/`, `/auth/login` 허용. Sitemap URL 포함.
  - 관련 파일: `app/robots.ts` (신규)

- [ ] 태스크 1.2c.1.5: `app/sitemap.ts` 생성
  - 상세: Next.js의 `MetadataRoute.Sitemap` 타입 사용. 공개 페이지만 포함: `/` (priority 1.0, weekly), `/auth/login` (priority 0.5, monthly). 인증 필요 페이지는 제외.
  - 관련 파일: `app/sitemap.ts` (신규)

- [ ] 태스크 1.2c.1.6: `news/[groupId]/page.tsx`에 `generateMetadata` 추가
  - 상세: `export async function generateMetadata({ params })` 구현. `getNewsGroupDetail(groupId)`로 그룹 데이터 조회. 동적 title: `"{대표기사 제목} | Lifeboard"`. description: `fact_summary` 첫 150자. Open Graph 메타데이터 포함. 그룹 미존재 시 기본 메타데이터 반환.
  - 관련 파일: `app/protected/news/[groupId]/page.tsx`

- [ ] 태스크 1.2c.1.7: 주요 페이지에 정적 metadata 추가
  - 상세: `/protected/page.tsx` (대시보드), `/auth/login/page.tsx` (로그인), `/admin/page.tsx` (관리자 대시보드)에 정적 `metadata` export 추가. 각 페이지 목적에 맞는 title/description 설정.
  - 관련 파일: `app/protected/page.tsx`, `app/auth/login/page.tsx`, `app/admin/page.tsx`

- [ ] 태스크 1.2c.1.8: Playwright MCP 테스트 - SEO 메타데이터 검증
  - 사전 조건: 태스크 1.2c.1.1 ~ 1.2c.1.7 완료
  - 검증 항목:
    1. `browser_navigate`로 `/` 접근 -> `browser_evaluate`로 `document.querySelector('meta[property="og:title"]')` 존재 확인
    2. `browser_navigate`로 `/robots.txt` 접근 -> `browser_snapshot`으로 Disallow `/protected/` 포함 확인
    3. `browser_navigate`로 `/sitemap.xml` 접근 -> `browser_snapshot`으로 공개 URL 포함 확인
    4. `browser_navigate`로 뉴스 상세 페이지 접근 -> `browser_evaluate`로 동적 `<title>` 확인 (기사 제목 포함)
    5. `browser_console_messages`로 에러 없음 확인
  - 결과: 메타데이터 검증 결과 기록

#### 마일스톤 1.2c.2: 에러 바운더리 보완 (F209)

- [ ] 태스크 1.2c.2.1: `app/protected/error.tsx` 추가
  - 상세: Client Component (`"use client"`). 기존 `app/protected/news/error.tsx` 패턴 참고. shadcn/ui `Card` + `Button` 조합. 에러 메시지: "페이지를 불러오는 중 문제가 발생했습니다." 재시도 버튼 (`reset()` 호출). 홈으로 돌아가기 링크.
  - 관련 파일: `app/protected/error.tsx` (신규)

- [ ] 태스크 1.2c.2.2: `app/admin/error.tsx` 추가
  - 상세: Client Component. 관리자 레이아웃에 맞는 스타일. 에러 메시지: "관리자 페이지 로드 중 문제가 발생했습니다." 재시도 버튼 + 관리자 대시보드로 돌아가기 링크. 기존 `news/error.tsx` 패턴 재사용.
  - 관련 파일: `app/admin/error.tsx` (신규)

- [ ] 태스크 1.2c.2.3: `app/protected/settings/error.tsx` 추가
  - 상세: Client Component. 에러 메시지: "설정 페이지를 불러오는 중 문제가 발생했습니다." 재시도 버튼 + 대시보드로 돌아가기 링크.
  - 관련 파일: `app/protected/settings/error.tsx` (신규)

- [ ] 태스크 1.2c.2.4: `weather-widget.tsx` 에러 시 안내 UI 반환
  - 상세: 현재 try-catch에서 `return null` (조용히 사라짐)을 `return <Card><p>날씨 정보를 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.</p></Card>` 형태로 변경. API 키 미설정 시에는 기존대로 `return null` 유지.
  - 관련 파일: `components/weather/weather-widget.tsx`

- [ ] 태스크 1.2c.2.5: Playwright MCP 테스트 - 에러 바운더리 존재 확인
  - 사전 조건: 태스크 1.2c.2.1 ~ 1.2c.2.4 완료
  - 검증 항목:
    1. `browser_navigate`로 `/protected` 접근 -> 정상 로드 확인 (에러 바운더리가 트리거되지 않는 정상 상태)
    2. `browser_navigate`로 `/admin` 접근 -> 정상 로드 확인
    3. `browser_navigate`로 `/protected/settings` 접근 -> 정상 로드 확인
    4. `browser_console_messages`로 에러 없음 확인
  - 결과: 각 페이지 정상 렌더링 스크린샷 저장
  - 비고: 에러 바운더리의 실제 트리거 테스트는 의도적 에러 주입이 필요하므로 수동 검증 권장

#### 마일스톤 1.2c.3: 성능 최적화 (F210)

- [ ] 태스크 1.2c.3.1: `news-dashboard-section.tsx`에서 `getUser()` -> `getClaims()` 전환
  - 상세: `createClient()` + `supabase.auth.getUser()` 호출을 `getClaims()`로 교체. `userId`는 `claims.sub`에서 추출. import 변경: `import { getClaims } from "@/lib/supabase/server"` (또는 해당 모듈).
  - 관련 파일: `components/news/news-dashboard-section.tsx` (약 16번째 줄)

- [ ] 태스크 1.2c.3.2: `news/page.tsx`에서 `getUser()` -> `getClaims()` 전환
  - 상세: 동일 패턴. `createClient()` + `getUser()` -> `getClaims()`. userId 추출용이므로 `.sub` 사용.
  - 관련 파일: `app/protected/news/page.tsx` (약 34번째 줄)

- [ ] 태스크 1.2c.3.3: `news/[groupId]/page.tsx`에서 `getUser()` -> `getClaims()` 전환
  - 상세: 동일 패턴. 북마크 상태 확인용 userId만 필요하므로 `getClaims().sub` 충분.
  - 관련 파일: `app/protected/news/[groupId]/page.tsx` (약 37번째 줄)

- [ ] 태스크 1.2c.3.4: `widget-settings.tsx` 부모 props로 preferences 수신
  - 상세: 현재 컴포넌트 마운트 시 `/api/user/preferences` GET 호출하는 로직 제거. 대신 `initialPreferences` prop으로 부모 Server Component에서 전달받음. 내부 상태는 `initialPreferences`로 초기화.
  - 관련 파일: `components/settings/widget-settings.tsx`

- [ ] 태스크 1.2c.3.5: `settings-content.tsx`에서 WidgetSettings에 preferences props 전달
  - 상세: 이미 `user_preferences` 데이터를 조회하고 있으므로, `WidgetSettings`에 `initialPreferences` prop으로 전달. WidgetSettings 컴포넌트의 마운트 후 GET 요청이 제거되어 네트워크 왕복 1회 절감.
  - 관련 파일: `app/protected/settings/settings-content.tsx`

- [ ] 태스크 1.2c.3.6: Playwright MCP 테스트 - 성능 최적화 검증
  - 사전 조건: 태스크 1.2c.3.1 ~ 1.2c.3.5 완료
  - 검증 항목:
    1. `browser_navigate`로 `/protected` 접근 -> 대시보드 뉴스 섹션 정상 로드
    2. `browser_navigate`로 `/protected/news` 접근 -> 뉴스 목록 정상 로드
    3. `browser_click`으로 뉴스 카드 클릭 -> 상세 페이지 정상 로드 + 북마크 버튼 정상 동작
    4. `browser_navigate`로 `/protected/settings` 접근 -> 위젯 설정 즉시 로드 (추가 네트워크 요청 없음)
    5. `browser_network_requests`로 `/protected/settings` 페이지에서 `/api/user/preferences` GET 호출이 없는지 확인
    6. `browser_console_messages`로 에러 없음 확인
  - 결과: 각 페이지 정상 동작 스크린샷 저장

---

### v1.2d: 알림 + 트렌드 + Naver 로그인

**목표:** 이메일 뉴스 다이제스트를 통해 선호 카테고리 뉴스를 정기 발송하고, 뉴스 트렌드 페이지로 키워드/카테고리 동향을 시각화하며, Naver 소셜 로그인 PoC를 진행한다.
**완료 기준:** 이메일 다이제스트 설정이 가능하고 테스트 발송이 성공하며, 트렌드 페이지에서 기간별 키워드/카테고리 차트를 확인할 수 있고, Naver 로그인 PoC 결과가 문서화된다.

#### 마일스톤 1.2d.1: 이메일 뉴스 다이제스트 (F202)

> 인프라 준비(Resend 설정)를 먼저 수행한 뒤, API Route -> Cron -> 설정 UI 순서로 구현한다.

- [ ] 태스크 1.2d.1.1: Resend 인프라 준비 및 환경변수 설정
  - 상세: `npm install resend` 패키지 추가. `.env.local`에 `RESEND_API_KEY`, `EMAIL_FROM` 환경변수 추가. `.env.example` 업데이트. Vercel 환경변수에도 등록.
  - 관련 파일: `package.json`, `.env.example`
  - 비고: Resend 계정 생성 + 발신자 도메인 DNS(SPF/DKIM) 설정은 수동 작업 필요

- [ ] 태스크 1.2d.1.2: 이메일 템플릿 모듈 구현
  - 상세: `lib/email/digest-template.ts` 신규. 뉴스 다이제스트 HTML 이메일 템플릿 생성 함수. 입력: 사용자명, 뉴스 그룹 목록 (제목, 카테고리, 요약 일부, 링크). 출력: HTML 문자열. 인라인 CSS 스타일링 (이메일 클라이언트 호환).
  - 관련 파일: `lib/email/digest-template.ts` (신규)

- [ ] 태스크 1.2d.1.3: `/api/email/digest` Route Handler 구현
  - 상세: GET 핸들러 (Vercel Cron 트리거). `CRON_SECRET` 인증 필수. (1) `user_preferences`에서 `email_digest_enabled = true`인 사용자 목록 조회. (2) 각 사용자의 `preferred_categories` 기반으로 최근 24시간 뉴스 그룹 조회. (3) 뉴스가 있으면 다이제스트 이메일 생성 + Resend로 발송. (4) 발송 결과 로깅. `createAdminClient()` 사용 (RLS 우회).
  - 관련 파일: `app/api/email/digest/route.ts` (신규)

- [ ] 태스크 1.2d.1.4: `vercel.json`에 이메일 다이제스트 Cron 추가
  - 상세: 기존 뉴스 수집 Cron과 별도로 이메일 다이제스트 Cron 추가. 예: 매일 KST 09:00 (UTC 00:00). `{ "path": "/api/email/digest", "schedule": "0 0 * * *" }`.
  - 관련 파일: `vercel.json`

- [ ] 태스크 1.2d.1.5: 설정 페이지 이메일 다이제스트 UI 추가
  - 상세: `/protected/settings` 페이지에 이메일 다이제스트 토글 추가. `email_digest_enabled` 필드 PUT으로 저장. 현재 등록된 이메일 주소 표시 (수정 불가, OAuth 연동 이메일). 활성화 시 "매일 아침 9시에 뉴스 요약을 보내드립니다" 안내 텍스트.
  - 관련 파일: `app/protected/settings/page.tsx` 또는 `components/settings/` 내 해당 컴포넌트

- [ ] 태스크 1.2d.1.6: Playwright MCP 테스트 - 이메일 다이제스트 설정 UI
  - 사전 조건: 태스크 1.2d.1.1 ~ 1.2d.1.5 완료
  - 검증 항목:
    1. `browser_navigate`로 `/protected/settings` 접근
    2. `browser_snapshot`으로 "이메일 다이제스트" 토글 존재 확인
    3. `browser_click`으로 토글 활성화
    4. `browser_network_requests`로 `/api/user/preferences` PUT 호출 확인
    5. `browser_snapshot`으로 활성화 안내 텍스트 표시 확인
    6. `browser_console_messages`로 에러 없음 확인
  - 결과: 설정 페이지 스크린샷 저장

#### 마일스톤 1.2d.2: 뉴스 트렌드 (F203)

- [ ] 태스크 1.2d.2.1: `lib/news/trends.ts` 트렌드 쿼리 함수 구현
  - 상세: (1) `getKeywordTrends(days: number)`: 최근 N일간 뉴스 그룹 대표 기사 제목에서 단어 빈도 집계. PostgreSQL `to_tsvector('simple', title)` + `ts_stat` 활용 또는 2~4글자 한글 연속 추출 방식. 상위 20개 키워드 반환. (2) `getCategoryTrends(days: number)`: 기간별 카테고리 분포 (일별 그룹 수). (3) `getNewsVolume(days: number)`: 일별 뉴스 그룹 생성 수. 모두 `createAdminClient()` 사용.
  - 관련 파일: `lib/news/trends.ts` (신규)

- [ ] 태스크 1.2d.2.2: `/protected/trends/page.tsx` 트렌드 페이지 구현
  - 상세: Server Component. 기간 선택 (7일/14일/30일). 3개 차트 섹션: (1) 인기 키워드 워드 클라우드 또는 바 차트, (2) 카테고리 분포 파이/바 차트, (3) 뉴스 볼륨 라인 차트. Recharts 사용 (관리자 대시보드 차트 패턴 재사용). `loading.tsx` 스켈레톤 추가.
  - 관련 파일: `app/protected/trends/page.tsx` (신규), `app/protected/trends/loading.tsx` (신규)

- [ ] 태스크 1.2d.2.3: `components/trends/` 차트 컴포넌트 구현
  - 상세: Client Component (Recharts 필수). (1) `keyword-chart.tsx`: 인기 키워드 수평 바 차트. (2) `category-trend-chart.tsx`: 카테고리별 일별 추이 스택 바 차트. (3) `volume-chart.tsx`: 일별 뉴스 볼륨 라인 차트. 기존 `components/admin/collection-chart.tsx`, `category-chart.tsx` 패턴 참고.
  - 관련 파일: `components/trends/keyword-chart.tsx` (신규), `components/trends/category-trend-chart.tsx` (신규), `components/trends/volume-chart.tsx` (신규)

- [ ] 태스크 1.2d.2.4: 네비게이션에 트렌드 링크 추가
  - 상세: `components/layout/nav-links.ts` 상수 배열에 `{ label: "트렌드", href: "/protected/trends" }` 추가. Header 데스크톱 네비게이션 + MobileNav에 자동 반영.
  - 관련 파일: `components/layout/nav-links.ts`

- [ ] 태스크 1.2d.2.5: Playwright MCP 테스트 - 뉴스 트렌드 페이지
  - 사전 조건: 태스크 1.2d.2.1 ~ 1.2d.2.4 완료, 충분한 뉴스 데이터 존재
  - 검증 항목:
    1. `browser_navigate`로 `/protected/trends` 접근 -> 페이지 정상 로드
    2. `browser_snapshot`으로 키워드 차트, 카테고리 차트, 볼륨 차트 존재 확인
    3. `browser_click`으로 기간 선택 (7일/14일/30일) -> 차트 데이터 갱신 확인
    4. `browser_navigate`로 `/protected` 접근 -> 네비게이션에 "트렌드" 링크 존재 확인
    5. `browser_click`으로 "트렌드" 링크 클릭 -> `/protected/trends` 이동 확인
    6. `browser_console_messages`로 에러 없음 확인
  - 결과: 트렌드 페이지 스크린샷 저장

#### 마일스톤 1.2d.3: Naver 소셜 로그인 PoC (F211)

> Naver는 OIDC 미지원으로 Supabase 네이티브 방식 불가. PoC를 먼저 진행하여 기술적 실현 가능성을 검증한 후 본격 구현 여부를 결정한다.

- [ ] 태스크 1.2d.3.1: Naver OAuth PoC - 기술 검증 문서 작성
  - 상세: (1) Naver 개발자 센터에서 애플리케이션 등록 + Client ID/Secret 획득. (2) 커스텀 OAuth 플로우 구현: 인증 URL 리다이렉트 -> 콜백에서 코드 수신 -> 액세스 토큰 교환 -> 사용자 정보 조회. (3) Supabase 세션 통합 방법 결정: `auth.admin.createUser()` + `generateLink({ type: 'magiclink' })` 또는 대안. (4) 기존 Google/Kakao 계정과 이메일 중복 시 처리 정책 결정. (5) PoC 결과 문서화 (`docs/poc-naver-oauth.md`).
  - 관련 파일: `docs/poc-naver-oauth.md` (신규)
  - 비고: PoC 실패 시 F211은 v1.3 이후로 이관 또는 Naver OIDC 지원 대기

- [ ] 태스크 1.2d.3.2: Naver OAuth 유틸리티 모듈 구현 (PoC 성공 시)
  - 상세: `lib/auth/naver.ts` 신규. `getNaverAuthUrl()`: Naver OAuth 인증 URL 생성. `exchangeNaverCode(code: string)`: 인증 코드 -> 액세스 토큰 교환. `getNaverUserInfo(accessToken: string)`: 사용자 정보(이메일, 이름, 프로필 이미지) 조회. 환경변수: `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`.
  - 관련 파일: `lib/auth/naver.ts` (신규)

- [ ] 태스크 1.2d.3.3: `/auth/callback/naver/route.ts` 콜백 핸들러 구현 (PoC 성공 시)
  - 상세: GET 핸들러. URL의 `code`, `state` 파라미터 수신. `exchangeNaverCode()` -> `getNaverUserInfo()` -> Supabase 사용자 생성/조회 -> 세션 설정 -> `/protected` 리다이렉트. 에러 시 `/auth/error` 리다이렉트. CSRF 방지를 위한 state 파라미터 검증.
  - 관련 파일: `app/auth/callback/naver/route.ts` (신규)

- [ ] 태스크 1.2d.3.4: 로그인 페이지에 Naver 로그인 버튼 추가 (PoC 성공 시)
  - 상세: `components/social-login-buttons.tsx`에 Naver 로그인 버튼 추가. Naver 브랜드 가이드라인 준수 (녹색 배경, 네이버 로고). `getNaverAuthUrl()`로 리다이렉트 URL 생성. 기존 Google/Kakao 버튼과 동일한 레이아웃.
  - 관련 파일: `components/social-login-buttons.tsx`

- [ ] 태스크 1.2d.3.5: Playwright MCP 테스트 - Naver 로그인 버튼 표시 (PoC 성공 시)
  - 사전 조건: 태스크 1.2d.3.2 ~ 1.2d.3.4 완료
  - 검증 항목:
    1. `browser_navigate`로 `/auth/login` 접근
    2. `browser_snapshot`으로 Naver 로그인 버튼 존재 확인 (Google, Kakao와 함께 3개)
    3. `browser_console_messages`로 에러 없음 확인
  - 결과: 로그인 페이지 스크린샷 저장
  - 비고: 실제 Naver OAuth 플로우 테스트는 Naver 테스트 계정 필요 (수동 검증 권장)

---

## 우선순위 매트릭스

| 기능                      | ID   | 우선순위 | 복잡도 | 단계  | 의존성                      |
| ------------------------- | ---- | -------- | ------ | ----- | --------------------------- |
| 뉴스 내용정리 시스템 개편 | F200 | Must     | 높음   | v1.2a | 없음                        |
| 날씨 위치 설정 개선       | F206 | Must     | 낮음   | v1.2a | 없음                        |
| 빠른 메모                 | F201 | Must     | 중간   | v1.2b | 없음 (DB 마이그레이션 선행) |
| 선호 카테고리 실제 활용   | F207 | Must     | 낮음   | v1.2b | 없음                        |
| SEO/메타데이터 개선       | F208 | Must     | 낮음   | v1.2c | 없음                        |
| 에러 바운더리 보완        | F209 | Should   | 낮음   | v1.2c | 없음                        |
| 성능 최적화               | F210 | Should   | 낮음   | v1.2c | 없음                        |
| 이메일 뉴스 다이제스트    | F202 | Should   | 중간   | v1.2d | Resend 인프라 준비          |
| 뉴스 트렌드               | F203 | Should   | 중간   | v1.2d | 충분한 뉴스 데이터 축적     |
| Naver 소셜 로그인         | F211 | Should   | 높음   | v1.2d | PoC 성공 여부에 따라 결정   |

## 리스크 및 고려사항

### 기술적 리스크

- **F200 서술형 전환**: 기존 불릿 포인트 요약 데이터와 신규 서술형 요약이 공존하는 전환 기간 동안 렌더링 호환성 확인 필요. `react-markdown`이 두 형식 모두 처리 가능하므로 리스크 낮음.
- **F206 Geolocation**: 브라우저 위치 권한 거부 시 기본값 유지로 대응. HTTPS 환경에서만 동작 (프로덕션은 HTTPS이므로 문제 없음, localhost 개발 환경 주의).
- **F211 Naver OAuth**: OIDC 미지원으로 커스텀 구현 필요. Supabase 세션 통합이 가장 큰 기술적 도전. PoC 실패 시 v1.3 이후로 이관.
- **F202 이메일 발송**: Resend 무료 플랜 일일 발송 제한(100통). 사용자 증가 시 유료 플랜 전환 또는 발송 빈도 조절 필요.

### 일정 리스크

- v1.2a~c는 독립적이므로 병렬 진행 가능하나, 코드 충돌 방지를 위해 순차 배포 권장.
- v1.2d의 F211(Naver PoC)은 결과에 따라 일정 변동 가능. PoC를 v1.2d 초기에 배치하여 조기 판단.

### 의존성 리스크

- **F201 RLS**: `memos` 테이블의 RLS 정책이 누락되면 보안 취약점. 마이그레이션에 반드시 포함.
- **F202 외부 서비스**: Resend 계정 + 도메인 DNS 설정이 선행되어야 함. 설정 지연 시 v1.2d 일정에 영향.
- **F208 favicon**: 디자인 에셋 준비가 선행 조건. 임시 placeholder 사용 후 교체 가능.

### 하위 호환성

- **F200**: 기존 불릿 포인트 요약이 저장된 `fact_summary`는 수정하지 않음. `react-markdown`이 불릿/서술형 모두 렌더링하므로 기존 데이터 호환.
- **F207**: `searchParams`에 `category`가 있는 기존 링크/북마크는 리다이렉트 없이 정상 동작.
- **F210**: `getClaims()` 전환은 내부 구현 변경이므로 사용자 영향 없음.

## 변경 이력

| 날짜       | 버전 | 변경 내용                                                  |
| ---------- | ---- | ---------------------------------------------------------- |
| 2026-02-19 | 1.0  | v1.2 로드맵 초기 생성 (PRD v3.0 기반, F200~F211 10개 기능) |

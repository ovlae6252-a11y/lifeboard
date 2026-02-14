# Lifeboard (라이프보드) MVP PRD

## 🎯 핵심 정보

**목적**: 인생의 모든 데이터를 한눈에 볼 수 있는 통합 대시보드. 뉴스, 일정, 건강, 재무 등 다양한 정보를 한 곳에서 관리하고 빠르게 파악할 수 있는 개인 라이프 허브 제공
**사용자**: 일상의 다양한 정보를 효율적으로 관리하고 한눈에 파악하고 싶은 개인 사용자

## 🚶 사용자 여정

```
1. [홈 페이지 /]
   ↓ 로그인 필요 → 자동 리디렉션

2. [로그인 페이지 /auth/login]
   ↓ 로그인 성공

3. [대시보드 메인 /protected]
   - 최신 뉴스 요약 6개 미리보기 (뉴스 대시보드 섹션)
   ↓ "더보기" 또는 네비게이션에서 "뉴스" 클릭

4. [뉴스 전체 목록 /protected/news]
   - 카테고리 탭으로 필터링 (전체, 정치, 경제, 사회, 생활/문화, IT/과학, 세계)
   - 뉴스 그룹 카드 목록 표시 (팩트 요약 + 원문 링크들)
   ↓ 카테고리 클릭

5. [카테고리별 뉴스 /protected/news?category=economy]
   - 해당 카테고리 뉴스만 필터링 표시
   ↓ 뉴스 그룹 카드 내 원문 링크 클릭

6. [외부 언론사 사이트]
   - 원본 기사 전체 내용 확인
```

## ⚡ 기능 명세

### 1. MVP 핵심 기능

| ID | 기능명 | 설명 | MVP 필수 이유 | 관련 페이지 |
|----|--------|------|-------------|------------|
| **F001** | RSS 뉴스 수집 | 한국 주요 언론사 RSS 피드에서 뉴스를 자동 수집 (Vercel Cron) | 뉴스 데이터 확보를 위한 핵심 인프라 | (백엔드 자동화) |
| **F002** | 중복 기사 그룹핑 | 같은 사건을 다룬 여러 기사를 제목 유사도 기반으로 하나의 그룹으로 묶음 | 정보 중복 제거 및 효율적 정보 소비 | (백엔드 자동화) |
| **F003** | AI 팩트 요약 | RSS 수집 시 자동으로 요약 작업 생성 → Ollama PC 워커가 자동 처리 → 사용자는 이미 정리된 팩트 뉴스를 열람 | 주관적 의견 배제, 사실 기반 정보 제공 | 뉴스 목록 페이지, 대시보드 메인 |
| **F004** | 뉴스 카테고리 필터 | 정치/경제/사회/생활문화/IT과학/세계 카테고리별 뉴스 조회 | 관심 분야 집중 탐색 | 뉴스 목록 페이지 |
| **F005** | 뉴스 그룹 카드 표시 | 팩트 요약 + 그룹 내 원문 기사 링크 목록 + 발행시간 | 요약과 원문 병행 확인 | 뉴스 목록 페이지, 대시보드 메인 |
| **F006** | 뉴스 대시보드 섹션 | 대시보드 메인에 최신 뉴스 요약 6개 미리보기 제공 | 대시보드 첫 번째 라이프 데이터 섹션 | 대시보드 메인 |

### 2. MVP 필수 지원 기능

| ID | 기능명 | 설명 | MVP 필수 이유 | 관련 페이지 |
|----|--------|------|-------------|------------|
| **F010** | 기본 인증 | 회원가입/로그인/로그아웃 (Supabase Auth) | 서비스 이용을 위한 최소 인증 | 로그인 페이지, 회원가입 페이지 |
| **F011** | 수집 로그 관리 | RSS 수집 성공/실패 로그 기록 | 수집 파이프라인 모니터링 및 디버깅 | (백엔드 자동화) |
| **F012** | 반응형 레이아웃 | 모바일/태블릿/데스크톱 화면 대응 | 다양한 디바이스에서 대시보드 이용 | 모든 페이지 |

### 3. MVP 이후 기능 (제외)

- 사용자별 관심 카테고리 설정 (개인화)
- 뉴스 북마크 기능
- 실시간 알림 (Slack/웹 푸시)
- 팩트 신뢰도 점수 표시 (다중 출처 일치도 기반)
- 해외 뉴스 RSS 추가 (Reuters, Bloomberg)
- 사용자 댓글 및 공유 기능

## 📱 메뉴 구조

```
📱 Lifeboard 내비게이션
├── 🏠 홈 (/)
│   └── 비로그인 시 랜딩 → 로그인 페이지로 리디렉션
└── 👤 인증 (비로그인 시)
    ├── 로그인 (/auth/login) - F010
    └── 회원가입 (/auth/sign-up) - F010

🔒 인증 사용자 메뉴 (로그인 후)
├── 📊 대시보드 (/protected)
│   └── 기능: F006 (뉴스 대시보드 섹션)
├── 📰 뉴스 (/protected/news)
│   └── 기능: F003, F004, F005 (팩트 요약, 카테고리 필터, 뉴스 그룹 카드)
└── 🚪 로그아웃
```

---

## 📄 페이지별 상세 기능

### 로그인 페이지 (`/auth/login`)

> **구현 기능:** `F010` | **메뉴 위치:** 비로그인 사용자 전용

| 항목 | 내용 |
|------|------|
| **역할** | 인증 전용 페이지 - 기존 사용자 로그인 |
| **진입 경로** | 미인증 사용자가 `/protected/*` 접근 시 자동 리디렉션, 또는 네비게이션에서 "로그인" 클릭 |
| **사용자 행동** | 이메일/비밀번호 입력 후 로그인 버튼 클릭 |
| **주요 기능** | • 이메일/비밀번호 입력 폼<br>• Supabase Auth 로그인 처리<br>• 에러 메시지 표시<br>• "회원가입" 링크 |
| **다음 이동** | 성공 → 대시보드 메인 (`/protected`), 실패 → 에러 표시 |

---

### 회원가입 페이지 (`/auth/sign-up`)

> **구현 기능:** `F010` | **메뉴 위치:** 비로그인 사용자 전용

| 항목 | 내용 |
|------|------|
| **역할** | 인증 전용 페이지 - 신규 사용자 계정 생성 |
| **진입 경로** | 로그인 페이지에서 "회원가입" 링크 클릭 또는 네비게이션에서 "회원가입" 클릭 |
| **사용자 행동** | 이메일/비밀번호 입력 후 회원가입 버튼 클릭 → 이메일 확인 대기 |
| **주요 기능** | • 이메일/비밀번호 입력 폼<br>• Supabase Auth 회원가입 처리<br>• 이메일 확인 안내 메시지<br>• "로그인" 링크 |
| **다음 이동** | 성공 → 이메일 확인 안내 페이지, 실패 → 에러 표시 |

---

### 대시보드 메인 (`/protected`)

> **구현 기능:** `F006` | **인증:** 로그인 필수

| 항목 | 내용 |
|------|------|
| **역할** | 메인 허브 - 인생의 다양한 데이터를 한눈에 보는 통합 대시보드 |
| **진입 경로** | 로그인 성공 후 자동 이동, 또는 네비게이션에서 "대시보드" 클릭 |
| **사용자 행동** | 각 섹션에서 핵심 정보를 빠르게 확인 → 상세 페이지로 이동 |
| **주요 기능** | • **뉴스 섹션** (최신 6개 뉴스 그룹 카드 표시, 팩트 요약 + 원문 링크)<br>• "더보기" 버튼 → `/protected/news`로 이동<br>• (향후 일정, 건강, 재무 등 다양한 라이프 데이터 섹션 확장 예정) |
| **다음 이동** | "더보기" → 뉴스 전체 목록 페이지, 카드 클릭 → 원문 기사 (외부 링크) |

---

### 뉴스 전체 목록 (`/protected/news`)

> **구현 기능:** `F003`, `F004`, `F005` | **인증:** 로그인 필수

| 항목 | 내용 |
|------|------|
| **역할** | 핵심 작업 수행 - 모든 뉴스 그룹을 카테고리별로 탐색 및 팩트 요약 확인 |
| **진입 경로** | 대시보드에서 "더보기" 클릭, 또는 네비게이션에서 "뉴스" 클릭 |
| **사용자 행동** | 카테고리 탭 선택 → 뉴스 그룹 카드 목록 스크롤 → 관심 기사 원문 링크 클릭 |
| **주요 기능** | • **카테고리 필터 탭** (전체/정치/경제/사회/생활문화/IT과학/세계)<br>• **뉴스 그룹 카드 그리드** (반응형 1열/2열)<br>• 각 카드: AI 팩트 요약 불릿 포인트 표시, 그룹 내 기사 개수, 원문 링크 목록, 발행시간<br>• 미요약 그룹: 원본 description으로 임시 표시하거나 숨김<br>• 무한 스크롤 또는 페이지네이션 |
| **다음 이동** | 카테고리 탭 클릭 → 쿼리 파라미터 변경 (`?category=economy`), 원문 링크 → 외부 언론사 사이트 |

---

### 카테고리별 뉴스 (`/protected/news?category=economy`)

> **구현 기능:** `F003`, `F004`, `F005` | **인증:** 로그인 필수

| 항목 | 내용 |
|------|------|
| **역할** | 핵심 작업 수행 - 특정 카테고리 뉴스만 필터링하여 표시 |
| **진입 경로** | 뉴스 전체 목록 페이지에서 카테고리 탭 클릭 |
| **사용자 행동** | 해당 카테고리 뉴스 그룹만 확인 → 원문 링크 클릭 |
| **주요 기능** | • 선택된 카테고리 뉴스 그룹만 필터링<br>• 뉴스 그룹 카드 표시 (동일 레이아웃)<br>• 카테고리 탭 상태 유지 |
| **다음 이동** | 다른 카테고리 탭 → 쿼리 파라미터 변경, 원문 링크 → 외부 언론사 사이트 |

---

## 🗄️ 데이터 모델

### news_sources (RSS 피드 소스 관리)
| 필드 | 설명 | 타입/관계 |
|------|------|----------|
| id | 고유 식별자 | UUID (PK) |
| name | 언론사명 (예: "경향신문", "연합뉴스") | TEXT |
| feed_url | RSS 피드 URL | TEXT (UNIQUE) |
| category | 뉴스 카테고리 (politics, economy 등) | TEXT |
| is_active | 수집 활성화 여부 | BOOLEAN |
| last_fetched_at | 마지막 수집 시각 | TIMESTAMPTZ |
| created_at | 소스 등록 시각 | TIMESTAMPTZ |

### news_articles (개별 뉴스 기사)
| 필드 | 설명 | 타입/관계 |
|------|------|----------|
| id | 고유 식별자 | UUID (PK) |
| source_id | 언론사 정보 | → news_sources.id |
| guid | RSS 피드 고유 ID | TEXT |
| title | 원본 기사 제목 | TEXT |
| title_normalized | 정규화된 제목 (그룹핑용) | TEXT |
| description | 기사 요약 | TEXT |
| original_url | 원문 기사 URL | TEXT |
| author | 작성자 | TEXT |
| category | 카테고리 | TEXT |
| published_at | 기사 발행 시각 | TIMESTAMPTZ |
| image_url | 썸네일 이미지 URL | TEXT |
| group_id | 뉴스 그룹 참조 | → news_article_groups.id |
| created_at | DB 저장 시각 | TIMESTAMPTZ |
| **UNIQUE(source_id, guid)** | 완전 중복 방지 | 복합 제약 |

### news_article_groups (중복 기사 그룹)
| 필드 | 설명 | 타입/관계 |
|------|------|----------|
| id | 고유 식별자 | UUID (PK) |
| representative_article_id | 대표 기사 참조 | → news_articles.id |
| category | 뉴스 카테고리 | TEXT |
| article_count | 그룹 내 기사 개수 | INTEGER |
| fact_summary | Ollama AI 팩트 요약 결과 | TEXT |
| is_summarized | 요약 완료 여부 | BOOLEAN (DEFAULT false) |
| summarized_at | 요약 완료 시각 | TIMESTAMPTZ |
| created_at | 그룹 생성 시각 | TIMESTAMPTZ |

### news_fetch_logs (수집 로그)
| 필드 | 설명 | 타입/관계 |
|------|------|----------|
| id | 고유 식별자 | UUID (PK) |
| source_id | 언론사 정보 | → news_sources.id |
| status | 수집 상태 (success/error) | TEXT |
| articles_fetched | 수집된 기사 수 | INTEGER |
| articles_new | 새로 추가된 기사 수 | INTEGER |
| error_message | 에러 메시지 (실패 시) | TEXT |
| created_at | 로그 기록 시각 | TIMESTAMPTZ |

### summarize_jobs (AI 요약 작업 큐)
| 필드 | 설명 | 타입/관계 |
|------|------|----------|
| id | 고유 식별자 | UUID (PK) |
| group_id | 요약 대상 뉴스 그룹 | → news_article_groups.id |
| status | 작업 상태 | TEXT (pending/processing/completed/failed) |
| error_message | 실패 시 에러 메시지 | TEXT |
| requested_by | 요청자 (user_id 또는 'system') | TEXT |
| created_at | 요청 시각 | TIMESTAMPTZ |
| started_at | 처리 시작 시각 | TIMESTAMPTZ |
| completed_at | 처리 완료 시각 | TIMESTAMPTZ |

**RLS (Row Level Security):**
- `news_articles`, `news_article_groups`, `news_sources`: 인증 사용자 읽기 전용
- `summarize_jobs`: 인증 사용자 읽기 + INSERT 허용, UPDATE는 service_role만
- `news_fetch_logs`: service_role만 접근 가능

---

## 🛠️ 기술 스택

### 🎨 프론트엔드 프레임워크

- **Next.js 16** (App Router) - React 풀스택 프레임워크
- **TypeScript 5.6+** - 타입 안전성 보장
- **React 19** - UI 라이브러리 (최신 동시성 기능)

### 🎨 스타일링 & UI

- **TailwindCSS 3** (CSS 변수 기반 테마) - 유틸리티 CSS 프레임워크
- **shadcn/ui** (new-york 스타일) - 고품질 React 컴포넌트 라이브러리
- **Lucide React** - 아이콘 라이브러리
- **next-themes** - 다크모드 지원 (class 방식)

### 🗄️ 백엔드 & 데이터베이스

- **Supabase** (@supabase/ssr) - BaaS (인증, 데이터베이스, RLS)
- **PostgreSQL** - 관계형 데이터베이스 (Supabase 포함)

### 🤖 AI & 데이터 수집

- **Ollama** (qwen2.5:14b) - 로컬 LLM (팩트 추출)
- **rss-parser** - RSS 피드 파싱 라이브러리

### 🚀 배포 & 호스팅

- **Vercel** - Next.js 15 최적화 배포 플랫폼 (Cron 작업 지원)

### 📦 패키지 관리

- **npm** - 의존성 관리

---

## 🏗️ 아키텍처 (Supabase 메시지 큐 기반)

```
[Vercel Cron (1시간마다)]
   ↓ API Route 호출 (/api/news/collect)
   ↓
[RSS 수집 파이프라인]
   ↓ rss-parser로 병렬 fetch (5초 타임아웃)
   ↓ 제목 정규화 → DB INSERT → 그룹핑
   ↓ 새 그룹 생성 시 summarize_jobs에 pending 작업 자동 INSERT
   ↓
[Supabase PostgreSQL (클라우드) - 메시지 큐 역할]
   ↓ summarize_jobs 테이블이 작업 큐로 동작
   ↓
[Ollama PC - 상주 워커]
   ↓ Supabase Realtime 구독 또는 폴링으로 pending 작업 감지
   ↓ 작업 상태를 processing으로 변경
   ↓ Ollama(localhost:11434)에 팩트 추출 요청
   ↓ 결과를 news_article_groups.fact_summary에 저장
   ↓ 작업 상태를 completed로 변경
   ↓
[Vercel 웹앱]
   ↓ 페이지 새로고침으로 결과 수신 (향후 Supabase Realtime 실시간 업데이트)
   ↓ 이미 팩트 기반으로 정리된 뉴스 표시
```

**핵심 특징:**
- **Vercel**: RSS 수집 Cron + 웹앱 호스팅
- **Supabase DB**: Vercel과 Ollama PC를 연결하는 **메시지 큐** + 데이터 저장소 (클라우드)
- **Ollama PC**: 같은 LAN 내 별도 PC에서 qwen2.5:14b 구동, **상주 워커**로 작업 자동 처리
- **scripts/** 디렉토리: Ollama PC에서 상시 실행하는 워커 스크립트 (최초 1회 복사)

---

## 📊 데이터 소스 (한국 주요 언론사 RSS)

**네이버 뉴스 RSS는 2023년 서비스 종료. 직접 언론사 RSS 피드 활용 (API 키 불필요, 무료)**

| 카테고리 | 언론사 | RSS URL |
|---------|--------|---------|
| politics | 경향신문 | https://www.khan.co.kr/rss/rssdata/politic_news.xml |
| politics | 연합뉴스 | http://www.yonhapnews.co.kr/RSS/politics.xml |
| economy | 경향신문 | https://www.khan.co.kr/rss/rssdata/economy_news.xml |
| economy | 연합뉴스 | http://www.yonhapnews.co.kr/RSS/economy.xml |
| economy | 한국경제 | https://www.hankyung.com/feed/all-news |
| society | 경향신문 | https://www.khan.co.kr/rss/rssdata/society_news.xml |
| society | 연합뉴스 | http://www.yonhapnews.co.kr/RSS/society.xml |
| culture | 경향신문 | https://www.khan.co.kr/rss/rssdata/culture_news.xml |
| culture | 연합뉴스 | http://www.yonhapnews.co.kr/RSS/culture.xml |
| science | 경향신문 | https://www.khan.co.kr/rss/rssdata/science_news.xml |
| science | 전자신문 | https://www.etnews.com/rss/Section901.xml |
| world | 경향신문 | https://www.khan.co.kr/rss/rssdata/kh_world.xml |
| world | 연합뉴스 | http://www.yonhapnews.co.kr/RSS/international.xml |

---

## 🔄 뉴스 수집 파이프라인 (상세)

### 1. Vercel Cron 트리거
- Vercel Cron: 1시간마다 `/api/news/collect` 호출
- `CRON_SECRET` 헤더 검증으로 보안 강화

### 2. RSS 피드 병렬 수집
- `rss-parser`로 모든 활성화된 RSS 피드 병렬 fetch
- 각 피드별 5초 타임아웃 설정 (무한 대기 방지)
- 성공/실패 여부를 `news_fetch_logs`에 기록

### 3. 제목 정규화
- `[속보]`, `[단독]`, `[화제]` 등 태그 제거
- 특수문자 제거, 공백 정리
- 소문자 변환 → `title_normalized` 필드에 저장

### 4. DB INSERT (중복 방지)
- `UNIQUE(source_id, guid)` 제약으로 완전 동일 기사 중복 방지
- 이미 존재하는 기사는 자동 스킵

### 5. 뉴스 그룹핑
- PostgreSQL 트라이그램 유사도 함수 사용
- `title_normalized` 간 유사도 0.6 이상이면 같은 그룹으로 묶음
- 대표 기사 (`representative_article_id`) 자동 선정

### 6. 수집 로그 기록
- 각 RSS 소스별 수집 결과 기록
- 성공/실패, 수집 개수, 신규 개수, 에러 메시지

### 7. 자동 요약 요청 생성
- 새 그룹 생성 시 → `summarize_jobs`에 자동으로 pending 작업 INSERT
- `requested_by = 'system'`으로 표시
- Ollama PC 워커가 이 작업을 자동으로 감지하여 처리

---

## 🤖 Ollama 팩트 요약 프로세스 (Supabase 메시지 큐 방식)

### 요약 요청 흐름 (자동, 백그라운드)
1. **자동 요청**: RSS 수집 후 새 그룹 생성 시 자동으로 `summarize_jobs`에 pending 작업 INSERT
2. 사용자 개입 불필요. 모든 요약은 시스템이 자동 처리

### Ollama PC 상주 워커 (DB → Ollama → DB)
1. Ollama PC에서 워커 스크립트가 **상시 실행** (데몬)
2. Supabase Realtime 구독으로 `summarize_jobs` 테이블의 INSERT 이벤트 감지
   - Realtime 연결 끊김 시 폴백으로 30초마다 폴링
3. pending 작업 감지 → status를 processing으로 변경 (동시 처리 방지)
4. 해당 그룹의 기사들 조회 → Ollama 팩트 추출 프롬프트 전송
5. 결과를 `news_article_groups.fact_summary`에 저장
6. 작업 status를 completed로 변경
7. 실패 시 status를 failed로 변경 + error_message 기록

### 사용자 경험 (DB → 웹)
1. 사용자가 뉴스 페이지에 접속하면 **이미 요약이 완료된 뉴스만 표시**
2. 요약이 아직 안 된 뉴스 그룹은 목록에서 숨기거나, 원본 description으로 임시 표시
3. 사용자는 항상 팩트 기반으로 잘 정리된 뉴스를 바로 확인 가능

### 팩트 추출 프롬프트

```
당신은 팩트 체커입니다. 아래 뉴스 기사들을 분석하여 다음 규칙을 따라 정리해주세요:

1. 검증 가능한 사실(팩트)만 추출하세요
2. 기자, 전문가, 관계자의 의견/전망/추측은 제외하세요
3. "~할 것으로 보인다", "~할 전망이다", "~라는 분석이다" 등 추측성 표현은 제외하세요
4. 여러 기사에서 공통으로 언급된 사실을 우선 포함하세요
5. 숫자, 날짜, 인물, 기관명 등 구체적 정보를 포함하세요
6. 3~5개 핵심 팩트를 불릿 포인트로 정리하세요

[뉴스 그룹 내 기사 제목 + 요약 목록]
```

### Ollama PC 워커 설정

**`scripts/worker.ts`** - 상주 워커 스크립트
```
scripts/
├── worker.ts          # 메인 워커 (Supabase Realtime + 폴링)
├── summarizer.ts      # Ollama 팩트 추출 로직
├── package.json       # 독립 패키지
├── .env.example       # 환경 변수 템플릿
└── README.md          # 설정 가이드
```

**`scripts/package.json`**:
```json
{
  "name": "lifeboard-worker",
  "private": true,
  "scripts": {
    "start": "npx tsx worker.ts",
    "dev": "npx tsx --watch worker.ts"
  },
  "dependencies": {
    "@supabase/supabase-js": "latest",
    "ollama": "latest",
    "tsx": "latest"
  }
}
```

**Ollama PC 설정 방법**:
```bash
# 1. scripts/ 폴더를 Ollama PC에 복사 (최초 1회)
# 2. Ollama PC에서:
cd scripts/
npm install
cp .env.example .env  # .env 편집

# 3. 워커 시작 (상시 실행)
npm start

# 4. (선택) Windows 서비스로 등록하여 PC 부팅 시 자동 시작
```

---

## 🌐 프론트엔드 구현 가이드

### 컴포넌트 구조
- **components/news-category-tabs.tsx**: 카테고리 필터 탭 (shadcn/ui Tabs)
- **components/news-group-card.tsx**: 뉴스 그룹 카드 (팩트 요약을 불릿 포인트로 표시 + 원문 링크 목록, 요약 미완료 시 원본 description으로 임시 표시하거나 숨김)
- **components/news-list.tsx**: 뉴스 그룹 카드 그리드 (반응형 1열/2열)
- **components/news-dashboard-section.tsx**: 대시보드용 뉴스 요약 섹션 (최신 6개)
- **components/news-skeleton.tsx**: 로딩 스켈레톤 (Suspense fallback)

### 레이아웃 수정
- **헤더**: "Next.js Supabase Starter" → "Lifeboard"
- **네비게이션**: "대시보드", "뉴스" 링크 추가
- **DeployButton 제거**: 불필요한 Supabase 배포 버튼 삭제

### 데이터 페칭
- Server Component에서 `createClient()` (server.ts)로 Supabase 클라이언트 생성
- `news_article_groups` 테이블 조회 (RLS로 인증 사용자만 읽기)
- 카테고리 필터: 쿼리 파라미터 `?category=economy`로 처리

---

## 🔐 환경 변수

### Vercel (웹앱)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbG...
CRON_SECRET=your-random-secret  # Vercel Cron 보안
```

### Ollama PC (scripts/.env)
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...  # RLS 우회 키
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:14b
```

---

## 🚀 향후 확장 계획 (MVP 이후)

### 단기 (v1.1)
- **해외 뉴스**: Reuters, Bloomberg RSS 추가
- **Supabase Realtime**: 요약 완료 시 웹에서 실시간 업데이트 (페이지 새로고침 불필요)

### 중기 (v1.2)
- **라이프 데이터 섹션 확장**: 일정(캘린더), 건강, 재무 등 새로운 대시보드 섹션 추가
- **개인화**: 사용자별 관심 카테고리 설정, 뉴스 북마크
- **팩트 신뢰도 점수**: 다중 출처에서 동일 팩트 언급 시 신뢰도 높게 표시

### 장기 (v2.0)
- **실시간 알림**: 중요 이벤트 발생 시 Slack/웹 푸시 알림
- **뉴스 트렌드 분석**: 시간대별 핫 토픽 자동 추출
- **외부 서비스 연동**: Google Calendar, 금융 API 등 다양한 데이터 소스 통합
- **사용자 댓글**: 뉴스 그룹별 간단한 의견 공유

---

## ✅ 정합성 검증 체크리스트

### 🔍 1단계: 기능 명세 → 페이지 연결 검증
- [x] F001, F002, F011: 백엔드 자동화 (페이지 없음, API 라우트)
- [x] F003, F005: 뉴스 목록 페이지, 대시보드 메인에 구현
- [x] F004: 뉴스 목록 페이지에 구현
- [x] F006: 대시보드 메인에 구현
- [x] F010: 로그인 페이지, 회원가입 페이지에 구현
- [x] F012: 모든 페이지에 구현 (공통 레이아웃)

### 🔍 2단계: 메뉴 구조 → 페이지 연결 검증
- [x] 홈 (/) → 페이지 존재 (리디렉션 전용)
- [x] 로그인 (/auth/login) → 로그인 페이지 존재
- [x] 회원가입 (/auth/sign-up) → 회원가입 페이지 존재
- [x] 대시보드 (/protected) → 대시보드 메인 페이지 존재
- [x] 뉴스 (/protected/news) → 뉴스 목록 페이지 존재

### 🔍 3단계: 페이지별 상세 기능 → 역참조 검증
- [x] 로그인 페이지 F010 → 기능 명세에 정의됨
- [x] 회원가입 페이지 F010 → 기능 명세에 정의됨
- [x] 대시보드 메인 F006 → 기능 명세에 정의됨
- [x] 뉴스 목록 F003, F004, F005 → 기능 명세에 정의됨

### 🔍 4단계: 누락 및 고아 항목 검증
- [x] 기능 명세의 모든 기능이 페이지 또는 백엔드에 구현됨
- [x] 페이지의 모든 기능이 기능 명세에 정의됨
- [x] 메뉴의 모든 항목이 실제 페이지로 존재함

---

**문서 버전**: v1.0
**작성일**: 2026-02-14
**작성자**: 1인 개발자용 PRD

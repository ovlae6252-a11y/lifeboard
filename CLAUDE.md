# CLAUDE.md

## 언어 및 코딩 규칙
- 기본 응답/주석/커밋/문서: 한국어
- 변수명/함수명: 영어 (코드 표준 준수)
- 들여쓰기: 2칸

## 실행 명령어
```bash
npm install           # 의존성 설치
npm run dev          # 개발 서버 (localhost:3000)
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 서버
npm run lint         # ESLint
```

## 기술 스택
- **Next.js 16.1.6** (App Router) + **React 19.2.3** + **TypeScript 5**
- **Tailwind CSS 4** + **Shadcn/ui** (Radix UI 개별 패키지 기반)
- **next-themes** (다크모드) + **react-wrap-balancer** (텍스트 균형)

## 아키텍처 원칙

### 중앙 집중식 설정
`lib/config.ts`에서 사이트명, 메뉴, 기능 목록, 텍스트를 한곳에서 관리. 컴포넌트에서 `config`를 import하여 사용.

### ThemeProvider 구조
- `layout.tsx`에서 `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>` 설정
- `<html>` 태그에 `suppressHydrationWarning` 적용 (ThemeProvider가 아닌 html 태그)
- `components/theme-provider.tsx`는 `next-themes`의 단순 래퍼

### Hydration 안전 패턴
클라이언트 컴포넌트에서 테마 접근 시 `useEffect + mounted` 패턴 사용 (참조: `theme-toggle.tsx`).
서버/클라이언트 불일치를 방지하기 위해 마운트 전까지 placeholder 렌더링.

### Server Component 기본
모든 컴포넌트는 기본 Server Component. 상태(`useState`), 이벤트(`onClick`), 훅(`useEffect`), 브라우저 API가 필요할 때만 `"use client"` 선언.

## 의존성 관리 규칙

### Shadcn/ui 컴포넌트 추가
```bash
npx shadcn@latest add [component-name]
```
- 수동 복사/붙여넣기 금지 — CLI가 dependencies와 import를 자동 처리
- 개별 `@radix-ui/react-*` 패키지 직접 설치 금지 — CLI 사용

### Radix UI 패키지
- 현재 표준: 개별 패키지 `@radix-ui/react-*` 사용 (import 방식: `import * as DialogPrimitive from "@radix-ui/react-dialog"`)
- 통합 패키지 `radix-ui` 사용 금지 (불안정)
- `npx shadcn@latest migrate radix` 실행 금지 (런타임 오류 위험)

### 패키지 설치 전 체크리스트
1. **Context7 MCP**로 최신 문서/호환성 확인
2. Next.js 16 + React 19 호환성 체크
3. Breaking changes 및 마이그레이션 가이드 확인
4. package.json에 중복 패키지 없는지 확인

### 핵심 원칙
코드에서 import하는 모든 패키지는 `package.json`의 `dependencies`에 명시적으로 설치되어야 함. 중첩 의존성에만 의존 금지.

## 트러블슈팅

| 증상 | 원인 | 해결책 |
|------|------|--------|
| 페이지 무한 로딩 (HTTP 응답 없음) | import와 dependencies 불일치 | `npm ls [package]`로 확인 후 명시적 설치 |
| 컴포넌트 미렌더링 | import 경로 오류 | `components/ui/` 파일 및 import 경로 검증 |
| "Cannot find module" | 패키지 미설치 | `npm install [package]`로 설치 |
| 빌드 성공 → 런타임 실패 | 코드/의존성 불일치 | HTTP 응답 확인 + `npm ls` 실행 |
| 빌드 실패 | TypeScript 타입 오류 | `npm run build`로 전체 컴파일 확인 |

## 확장 가이드
- **페이지 추가**: `app/[path]/page.tsx` 파일 생성 → 자동 라우트
- **콘텐츠 변경**: `lib/config.ts` 수정 (사이트명, 메뉴, 기능 목록 등)
- **UI 컴포넌트 추가**: `npx shadcn@latest add [name]` → `components/ui/`에 저장
- **클래스 병합**: `cn("base", condition && "conditional")` 유틸리티 사용

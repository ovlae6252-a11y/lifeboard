# Next.js 스타터킷

빠르고 현대적인 랜딩 페이지를 만드는 완벽한 출발점입니다. 이 스타터킷은 Next.js 16과 Tailwind CSS 4로 만들어졌으며, 프로덕션 환경에서 즉시 사용할 수 있습니다.

## ✨ 주요 기능

이 스타터킷에는 다음과 같은 기능들이 포함되어 있습니다:

- **⚡ 빠른 성능** - Next.js 16의 최적화된 성능과 빠른 빌드 시간으로 사용자에게 빠른 경험 제공
- **🛡️ 타입 안전성** - TypeScript로 코드를 작성해 실수를 줄이고 개발하기 편함
- **🎨 아름다운 디자인** - Tailwind CSS 4와 Shadcn/ui로 쉽게 스타일을 변경할 수 있음
- **📱 반응형 디자인** - 휴대폰, 태블릿, 데스크톱 모든 기기에서 완벽하게 작동
- **🌙 다크모드 지원** - next-themes로 쉽게 밝은 모드와 어두운 모드를 전환
- **🚀 즉시 배포 가능** - 프로덕션 레벨의 완성된 코드로 바로 배포 가능

## 🛠️ 기술 스택

이 프로젝트는 다음과 같은 최신 기술들로 만들어졌습니다:

### 프레임워크 & 라이브러리
- **Next.js 16.1.6** - React를 기반으로 한 풀스택 프레임워크 (라우팅, 서버 최적화 등)
- **React 19.2.3** - 사용자 인터페이스를 만드는 라이브러리
- **TypeScript 5** - JavaScript에 타입을 추가해 더 안전한 코드 작성

### 스타일링 & UI
- **Tailwind CSS 4** - CSS 클래스로 빠르게 디자인하는 프레임워크
- **Shadcn/ui** - 아름답고 접근성 좋은 UI 컴포넌트 모음 (Radix UI 기반)
- **next-themes** - 다크모드/라이트모드 자동 관리

### 추가 유틸리티
- **react-wrap-balancer** - 제목 텍스트를 자동으로 예쁘게 배치
- **clsx & tailwind-merge** - CSS 클래스 병합 유틸리티

## 🚀 시작하기

### 필수 요구사항
Node.js 18 버전 이상이 설치되어 있어야 합니다. [Node.js 공식 웹사이트](https://nodejs.org/)에서 다운로드할 수 있습니다.

### 단계별 설치

#### 1. 저장소 클론하기
이 저장소를 복사해서 내 컴퓨터에 저장합니다:

```bash
git clone https://github.com/your-username/claude-nextjs-starterkit.git
cd claude-nextjs-starterkit
```

#### 2. 의존성 설치하기
필요한 라이브러리들을 설치합니다:

```bash
npm install
```

이 명령어는 `package.json` 파일에 나열된 모든 필요한 라이브러리를 자동으로 다운로드합니다.

#### 3. 개발 서버 실행하기
다음 명령어로 개발 서버를 시작합니다:

```bash
npm run dev
```

개발 서버가 시작되면 터미널에 다음과 같은 메시지를 볼 수 있습니다:
```
> Ready in 1234ms
```

#### 4. 브라우저에서 확인하기
웹 브라우저를 열고 [http://localhost:3000](http://localhost:3000)으로 접속합니다. 랜딩 페이지를 볼 수 있습니다!

### 개발 중 사용하는 명령어

```bash
npm run dev      # 개발 서버 실행 (자동으로 변경 감지하고 새로고침)
npm run build    # 프로덕션용으로 최적화된 빌드 생성
npm run start    # 빌드된 프로덕션 버전 실행
npm run lint     # 코드 스타일 확인 및 에러 탐지
```

## 📁 프로젝트 구조

프로젝트의 폴더 구조를 이해하면 수정하기가 훨씬 쉬워집니다:

```
claude-nextjs-starterkit/
├── app/                      # Next.js 페이지 폴더
│   ├── layout.tsx           # 모든 페이지의 공통 레이아웃 (헤더, 테마 설정 등)
│   ├── page.tsx             # 홈페이지 (히어로/기능/CTA 섹션)
│   ├── login/page.tsx       # 로그인 페이지
│   └── globals.css          # 전체 사이트 스타일
│
├── components/              # 재사용 가능한 UI 컴포넌트
│   ├── header.tsx           # 상단 네비게이션 메뉴
│   ├── login-form.tsx       # 로그인 폼 컴포넌트
│   ├── theme-toggle.tsx     # 다크모드 토글 버튼
│   ├── mobile-menu.tsx      # 휴대폰용 슬라이드 메뉴
│   ├── theme-provider.tsx   # 다크모드 기능 설정
│   └── ui/                  # Shadcn/ui 컴포넌트들
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       └── sheet.tsx
│
├── lib/                     # 도움이 되는 함수들
│   ├── config.ts            # 📌 사이트 설정을 한곳에서 관리 (매우 중요!)
│   └── utils.ts             # CSS 유틸리티 함수
│
├── public/                  # 이미지, 폰트 등 정적 파일
├── components.json          # Shadcn/ui CLI 설정
├── package.json             # 프로젝트 정보 및 라이브러리 목록
├── postcss.config.mjs       # PostCSS 설정 (Tailwind CSS 연동)
├── tsconfig.json            # TypeScript 설정
├── next.config.ts           # Next.js 설정
└── README.md                # 이 파일
```

### 📌 가장 중요한 파일: lib/config.ts

`lib/config.ts` 파일에서 전체 사이트의 텍스트, 메뉴, 기능을 한곳에서 관리합니다. 이 파일만 수정하면 `Header`, `MobileMenu`, 홈페이지에 모두 반영됩니다:

```typescript
export const config = {
  name: "사이트명",
  description: "설명",
  nav: [
    { title: "메뉴1", href: "/" },
    { title: "메뉴2", href: "#features" },
  ],
  features: [
    { icon: "⚡", title: "기능명", description: "설명" },
  ],
};
```

## 🎨 커스터마이징

이 스타터킷을 자신의 프로젝트에 맞게 수정하는 방법을 알아봅시다.

### 1. 사이트 정보 변경하기

`lib/config.ts` 파일을 열고 다음을 수정합니다:

```typescript
export const config = {
  name: "My Awesome Project",              // 사이트 이름
  description: "설명을 여기에 적으세요",    // 사이트 설명
  nav: [
    { title: "홈", href: "/" },
    { title: "기능", href: "#features" },
    { title: "연락처", href: "#contact" },
  ],
  // ...
};
```

변경하면 자동으로 헤더, 메뉴, 메타데이터에 반영됩니다.

### 2. 기능 섹션 수정하기

똑같이 `lib/config.ts`에서 `features` 배열을 수정합니다:

```typescript
features: [
  {
    icon: "⚡",                    // 이모지 아이콘
    title: "빠른 성능",            // 기능 제목
    description: "설명을 여기에"   // 기능 설명
  },
  // 더 많은 기능을 추가하세요
],
```

### 3. 새 페이지 추가하기

예를 들어, About 페이지를 만들고 싶다면:

1. `app/about/page.tsx` 파일을 만듭니다
2. 다음 코드를 작성합니다:

```typescript
// app/about/page.tsx
export default function About() {
  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-20">
        <h1 className="text-4xl font-bold mb-6">About Us</h1>
        <p>여기에 콘텐츠를 작성하세요</p>
      </div>
    </main>
  );
}
```

3. `lib/config.ts`의 `nav`에 메뉴를 추가합니다:

```typescript
nav: [
  { title: "홈", href: "/" },
  { title: "About", href: "/about" },  // 추가됨
],
```

### 4. UI 컴포넌트 추가하기

더 많은 컴포넌트가 필요하다면 Shadcn/ui CLI로 추가할 수 있습니다:

```bash
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add tabs
```

여기서 사용 가능한 모든 컴포넌트는 [Shadcn/ui 문서](https://ui.shadcn.com)에서 확인할 수 있습니다.

### 5. 스타일 변경하기

Tailwind CSS를 사용하므로 클래스 이름으로 스타일을 변경합니다:

```typescript
// 변경 전
<button className="bg-blue-600">버튼</button>

// 변경 후 (더 큼)
<button className="bg-green-600 text-xl px-6 py-3">버튼</button>
```

Tailwind의 모든 유틸리티 클래스는 [공식 문서](https://tailwindcss.com/docs)에서 찾을 수 있습니다.

## 📦 빌드 및 배포

### 로컬에서 프로덕션 빌드 테스트하기

다음 명령어로 프로덕션 버전을 만들어 테스트할 수 있습니다:

```bash
npm run build    # 최적화된 빌드 생성
npm run start    # 빌드된 버전 실행 (http://localhost:3000)
```

모든 것이 잘 작동하면 배포할 준비가 된 것입니다.

### Vercel에 배포하기 (추천)

Vercel은 Next.js를 만든 회사이므로 배포가 매우 쉽습니다:

#### 방법 1: GitHub로 연결 (자동 배포)
1. GitHub 계정을 만듭니다 ([github.com](https://github.com))
2. 이 프로젝트를 GitHub에 올립니다
3. [Vercel](https://vercel.com)에 접속해 GitHub 계정으로 로그인합니다
4. "New Project"를 클릭하고 GitHub 저장소를 선택합니다
5. "Deploy"를 클릭하면 완료입니다!

이제 GitHub에 업로드할 때마다 자동으로 배포됩니다.

#### 방법 2: 수동 배포
1. [Vercel CLI](https://vercel.com/download)를 설치합니다
2. 터미널에서 다음을 실행합니다:
   ```bash
   npm install -g vercel
   vercel
   ```
3. 지시에 따라 로그인하고 배포를 완료합니다

### 다른 호스팅 서비스 사용하기

다른 서비스(Netlify, AWS 등)를 사용하고 싶다면:

```bash
npm run build   # 빌드 폴더 생성
```

생성된 `.next` 폴더를 호스팅 서비스에 업로드하면 됩니다. 자세한 내용은 [Next.js 배포 문서](https://nextjs.org/docs/app/building-your-application/deploying)를 참고하세요.

## 📚 더 알아보기

더 깊이 있게 배우고 싶다면 다음 문서들을 참고하세요:

- **[Next.js 공식 문서](https://nextjs.org/docs)** - Next.js의 모든 기능 설명
- **[Tailwind CSS 문서](https://tailwindcss.com/docs)** - 스타일링 방법
- **[Shadcn/ui 문서](https://ui.shadcn.com)** - UI 컴포넌트 사용법
- **[React 공식 문서](https://react.dev)** - React 기초 학습
- **[TypeScript 핸드북](https://www.typescriptlang.org/docs/)** - TypeScript 배우기

## 🤝 기여하기

이 프로젝트를 더 좋게 만드는 것을 도와주고 싶으신가요?

1. 저장소를 Fork합니다
2. 새로운 브랜치를 만듭니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m "Add amazing feature"`)
4. 브랜치에 Push합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 만듭니다

## 📄 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다. 자유롭게 사용하세요!

---

**즐거운 개발되세요! 🚀**

문제가 있거나 질문이 있다면 GitHub Issues에 남겨주세요.

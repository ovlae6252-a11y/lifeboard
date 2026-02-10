// 전체 사이트 설정을 한곳에서 관리합니다
export const config = {
  name: "Next.js 스타터킷",
  description: "Next.js 16과 Tailwind CSS 4로 만든 빠르고 현대적인 랜딩 페이지 스타터킷",

  // 사이트 URL (SEO, 메타데이터에 사용)
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://example.com",
  ogImage: "/og-image.png",

  // 네비게이션 메뉴
  nav: [
    { title: "홈", href: "/" },
    { title: "소개", href: "/about" },
    { title: "기능", href: "/#features" },
    { title: "가격", href: "/pricing" },
    { title: "블로그", href: "/blog" },
    { title: "문의", href: "/contact" },
  ],

  // 기능 섹션에 표시할 항목들
  features: [
    {
      icon: "⚡",
      title: "빠른 성능",
      description: "Next.js 16의 최적화된 성능과 빠른 빌드 시간",
    },
    {
      icon: "🛡️",
      title: "타입 안전성",
      description: "TypeScript로 작성되어 개발 경험과 안정성 향상",
    },
    {
      icon: "🎨",
      title: "아름다운 디자인",
      description: "Tailwind CSS 4와 Shadcn/ui로 쉬운 커스터마이징",
    },
    {
      icon: "📱",
      title: "반응형 디자인",
      description: "모든 기기에서 완벽하게 작동하는 반응형 레이아웃",
    },
    {
      icon: "🌙",
      title: "다크모드 지원",
      description: "next-themes로 쉽게 테마를 전환할 수 있습니다",
    },
    {
      icon: "🚀",
      title: "즉시 배포 가능",
      description: "프로덕션 레벨의 코드로 바로 배포할 수 있습니다",
    },
  ],

  // 푸터 정보
  footer: {
    description: "Next.js 16 기반의 현대적인 웹 개발 스타터킷입니다.",
    sections: [
      {
        title: "제품",
        links: [
          { title: "기능", href: "/#features" },
          { title: "가격", href: "/pricing" },
          { title: "블로그", href: "/blog" },
        ],
      },
      {
        title: "회사",
        links: [
          { title: "소개", href: "/about" },
          { title: "문의", href: "/contact" },
        ],
      },
      {
        title: "개발자",
        links: [
          { title: "문서", href: "https://nextjs.org/docs" },
          { title: "GitHub", href: "https://github.com" },
        ],
      },
    ],
    social: [
      { name: "GitHub", href: "https://github.com" },
      { name: "Twitter", href: "https://twitter.com" },
    ],
  },

  // 소개 페이지 데이터
  about: {
    hero: {
      title: "더 나은 웹을 만들어갑니다",
      description: "우리는 개발자들이 빠르고 아름다운 웹 애플리케이션을 쉽게 구축할 수 있도록 돕습니다.",
    },
    mission: {
      title: "우리의 미션",
      description: "모든 개발자가 프로덕션 레벨의 웹 애플리케이션을 빠르게 구축할 수 있는 도구를 제공합니다. 복잡한 설정 없이, 아름다운 디자인과 최적의 성능을 갖춘 프로젝트를 시작하세요.",
    },
    values: [
      {
        icon: "💡",
        title: "단순함",
        description: "복잡함을 줄이고 핵심에 집중합니다. 직관적인 API와 명확한 문서로 학습 곡선을 최소화합니다.",
      },
      {
        icon: "⚡",
        title: "성능",
        description: "모든 결정에서 성능을 최우선으로 고려합니다. 빠른 빌드, 빠른 로딩, 최적화된 번들 사이즈.",
      },
      {
        icon: "🤝",
        title: "커뮤니티",
        description: "오픈소스 정신을 바탕으로 함께 성장합니다. 개발자 커뮤니티의 피드백으로 더 나은 도구를 만듭니다.",
      },
    ],
    team: [
      {
        name: "김민수",
        role: "CEO & 공동 창업자",
        bio: "10년간 프론트엔드 개발을 이끌며 수백 개의 웹 프로젝트를 성공적으로 완수했습니다.",
        avatar: "MS",
      },
      {
        name: "이서연",
        role: "CTO & 공동 창업자",
        bio: "풀스택 개발자로서 확장 가능한 아키텍처 설계와 DevOps에 전문성을 보유하고 있습니다.",
        avatar: "SY",
      },
      {
        name: "박지호",
        role: "디자인 리드",
        bio: "사용자 중심의 디자인 철학으로 직관적이고 아름다운 인터페이스를 만들어냅니다.",
        avatar: "JH",
      },
    ],
  },

  // 가격 페이지 데이터
  pricing: {
    hero: {
      title: "심플한 가격 정책",
      description: "프로젝트 규모에 맞는 플랜을 선택하세요. 언제든지 업그레이드하거나 다운그레이드할 수 있습니다.",
    },
    plans: [
      {
        name: "스타터",
        description: "개인 프로젝트나 소규모 사이트에 적합합니다.",
        price: { monthly: 0, yearly: 0 },
        features: [
          "기본 컴포넌트 5개",
          "커뮤니티 지원",
          "기본 템플릿 1개",
          "MIT 라이선스",
        ],
        cta: "무료로 시작",
        highlighted: false,
      },
      {
        name: "프로",
        description: "전문 개발자와 성장하는 팀을 위한 플랜입니다.",
        price: { monthly: 29, yearly: 290 },
        features: [
          "모든 컴포넌트 무제한",
          "우선 이메일 지원",
          "프리미엄 템플릿 10개",
          "소스코드 접근",
          "1년 무료 업데이트",
        ],
        cta: "프로 시작하기",
        highlighted: true,
        badge: "추천",
      },
      {
        name: "엔터프라이즈",
        description: "대규모 팀과 기업을 위한 맞춤형 솔루션입니다.",
        price: { monthly: 99, yearly: 990 },
        features: [
          "프로 플랜의 모든 기능",
          "전담 기술 지원",
          "맞춤형 컴포넌트 개발",
          "SLA 보장",
          "온보딩 교육",
          "무제한 업데이트",
        ],
        cta: "영업팀 문의",
        highlighted: false,
      },
    ],
    faq: [
      {
        question: "무료 플랜으로도 상업적 프로젝트에 사용할 수 있나요?",
        answer: "네, 무료 플랜은 MIT 라이선스를 따르므로 상업적 프로젝트에도 자유롭게 사용할 수 있습니다.",
      },
      {
        question: "업그레이드나 다운그레이드는 어떻게 하나요?",
        answer: "대시보드에서 언제든지 플랜을 변경할 수 있습니다. 업그레이드 시 차액만 결제되며, 다운그레이드 시 남은 기간만큼 크레딧이 제공됩니다.",
      },
      {
        question: "환불 정책은 어떻게 되나요?",
        answer: "구매 후 14일 이내에 환불을 요청하시면 전액 환불해 드립니다. 만족하지 못하실 경우 언제든지 문의해 주세요.",
      },
      {
        question: "팀 라이선스는 어떻게 작동하나요?",
        answer: "프로 플랜은 개인 사용, 엔터프라이즈 플랜은 팀 전체가 사용할 수 있습니다. 팀 규모에 따라 맞춤형 견적을 제공합니다.",
      },
    ],
  },

  // 문의 페이지 데이터
  contact: {
    hero: {
      title: "문의하기",
      description: "궁금한 점이 있으시면 언제든지 연락주세요. 빠르게 답변 드리겠습니다.",
    },
    info: [
      { icon: "📧", label: "이메일", value: "hello@example.com" },
      { icon: "📍", label: "주소", value: "서울특별시 강남구 테헤란로 123" },
      { icon: "📞", label: "전화", value: "02-1234-5678" },
    ],
    inquiryTypes: [
      "일반 문의",
      "기술 지원",
      "가격 문의",
      "파트너십 제안",
      "기타",
    ],
  },

  // 블로그 데이터
  blog: {
    hero: {
      title: "블로그",
      description: "웹 개발 트렌드, 튜토리얼, 그리고 최신 업데이트 소식을 전합니다.",
    },
    posts: [
      {
        slug: "nextjs-16-new-features",
        title: "Next.js 16의 새로운 기능 살펴보기",
        description: "Next.js 16에서 추가된 주요 기능들과 개선 사항을 정리합니다.",
        date: "2025-12-15",
        author: { name: "김민수", avatar: "MS" },
        tags: ["Next.js", "React"],
        readingTime: "5분",
        content: `## Next.js 16이란?

Next.js 16은 React 19를 기반으로 한 최신 프레임워크 버전입니다. 이번 릴리스에서는 성능 개선과 개발자 경험 향상에 초점을 맞추었습니다.

## 주요 변경 사항

App Router가 더욱 안정화되었고, 서버 컴포넌트의 성능이 크게 개선되었습니다. 특히 스트리밍 렌더링과 부분 사전 렌더링(PPR)이 눈에 띄는 개선점입니다.

## Turbopack 정식 지원

개발 서버에서 Turbopack이 기본으로 활성화되어 빌드 속도가 획기적으로 빨라졌습니다. 대규모 프로젝트에서도 빠른 HMR을 경험할 수 있습니다.

## 마이그레이션 가이드

기존 Next.js 15 프로젝트에서 업그레이드하는 방법은 간단합니다. package.json에서 버전을 변경하고, 새로운 API에 맞게 코드를 수정하면 됩니다.`,
      },
      {
        slug: "tailwind-css-4-guide",
        title: "Tailwind CSS 4 완벽 가이드",
        description: "Tailwind CSS 4의 새로운 엔진과 설정 방법을 알아봅니다.",
        date: "2025-11-28",
        author: { name: "이서연", avatar: "SY" },
        tags: ["CSS", "Tailwind"],
        readingTime: "7분",
        content: `## Tailwind CSS 4의 새로운 아키텍처

Tailwind CSS 4는 완전히 새로운 엔진 위에 구축되었습니다. Oxide 엔진으로 빌드 속도가 10배 이상 빨라졌습니다.

## CSS-First 설정

더 이상 tailwind.config.js가 필요하지 않습니다. CSS 파일에서 직접 설정할 수 있어 더 직관적인 개발이 가능합니다.

## 새로운 유틸리티 클래스

컨테이너 쿼리, 새로운 그라디언트 문법, 그리고 향상된 반응형 디자인 유틸리티가 추가되었습니다.

## 마이그레이션

Tailwind CSS 3에서 4로의 마이그레이션은 대부분 자동으로 처리됩니다. 공식 마이그레이션 도구를 사용하면 쉽게 전환할 수 있습니다.`,
      },
      {
        slug: "react-server-components",
        title: "React 서버 컴포넌트 실전 활용법",
        description: "서버 컴포넌트의 개념부터 실전 패턴까지 깊이 있게 다룹니다.",
        date: "2025-11-10",
        author: { name: "박지호", avatar: "JH" },
        tags: ["React", "Server Components"],
        readingTime: "8분",
        content: `## 서버 컴포넌트란?

React 서버 컴포넌트는 서버에서만 실행되는 컴포넌트입니다. 클라이언트로 JavaScript를 전송하지 않아 번들 사이즈를 줄이고 초기 로딩 성능을 개선합니다.

## 언제 서버 컴포넌트를 사용할까?

데이터베이스 접근, API 호출, 무거운 라이브러리 사용 등 서버에서 처리하는 것이 효율적인 작업에 적합합니다.

## 클라이언트 컴포넌트와의 경계

상태 관리, 이벤트 핸들러, 브라우저 API가 필요한 컴포넌트는 "use client" 지시어를 사용합니다. 서버와 클라이언트 컴포넌트를 적절히 조합하는 것이 핵심입니다.

## 실전 패턴

데이터 페칭은 서버 컴포넌트에서, 사용자 인터랙션은 클라이언트 컴포넌트에서 처리하는 패턴이 가장 일반적입니다.`,
      },
      {
        slug: "shadcn-ui-best-practices",
        title: "Shadcn/ui 베스트 프랙티스",
        description: "Shadcn/ui를 효과적으로 사용하는 팁과 커스터마이징 방법을 소개합니다.",
        date: "2025-10-22",
        author: { name: "김민수", avatar: "MS" },
        tags: ["UI", "Shadcn"],
        readingTime: "6분",
        content: `## Shadcn/ui의 철학

Shadcn/ui는 전통적인 컴포넌트 라이브러리와 다릅니다. npm 패키지가 아니라 프로젝트에 직접 복사되는 코드입니다. 이를 통해 완전한 커스터마이징이 가능합니다.

## 설치와 설정

CLI를 사용하면 필요한 컴포넌트만 선택적으로 설치할 수 있습니다. 프로젝트에 맞는 테마와 스타일을 적용하세요.

## 커스터마이징 팁

각 컴포넌트의 variants를 확장하거나 새로운 스타일을 추가할 수 있습니다. Tailwind CSS의 유틸리티 클래스와 함께 사용하면 무한한 가능성이 열립니다.

## 접근성

Radix UI 프리미티브 기반이므로 키보드 네비게이션, 스크린 리더 지원 등 접근성이 기본 내장되어 있습니다.`,
      },
    ],
  },
} as const;

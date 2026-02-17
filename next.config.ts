import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns: [
      // 주요 한국 언론사 이미지 도메인
      {
        protocol: "https",
        hostname: "*.yonhapnews.co.kr",
      },
      {
        protocol: "https",
        hostname: "*.yna.co.kr",
      },
      {
        protocol: "https",
        hostname: "*.joins.com",
      },
      {
        protocol: "https",
        hostname: "*.chosun.com",
      },
      {
        protocol: "https",
        hostname: "*.donga.com",
      },
      {
        protocol: "https",
        hostname: "*.hani.co.kr",
      },
      {
        protocol: "https",
        hostname: "**.hani.co.kr",
      },
      {
        protocol: "https",
        hostname: "*.khan.co.kr",
      },
      {
        protocol: "https",
        hostname: "*.hankyung.com",
      },
      {
        protocol: "https",
        hostname: "*.mk.co.kr",
      },
      {
        protocol: "https",
        hostname: "*.sedaily.com",
      },
      {
        protocol: "https",
        hostname: "*.etnews.com",
      },
      {
        protocol: "https",
        hostname: "*.zdnet.co.kr",
      },
      {
        protocol: "https",
        hostname: "*.sbs.co.kr",
      },
      {
        protocol: "https",
        hostname: "*.jtbc.co.kr",
      },
      {
        protocol: "https",
        hostname: "*.kbs.co.kr",
      },
      {
        protocol: "https",
        hostname: "*.imbc.com",
      },
      {
        protocol: "https",
        hostname: "*.seoul.co.kr",
      },
      {
        protocol: "https",
        hostname: "*.joongang.co.kr",
      },
      // CDN 및 일반적인 이미지 호스팅
      {
        protocol: "https",
        hostname: "img*.com",
      },
      {
        protocol: "https",
        hostname: "*.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;

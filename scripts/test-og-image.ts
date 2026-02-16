import { fetchOgImage, fetchOgImagesBatch } from "@/lib/news/og-image-fetcher";

async function testOgImage() {
  // 테스트 URL들 (최근 한국경제 기사)
  const testUrls = [
    "https://www.hankyung.com/article/202602167759i",
    "https://www.hankyung.com/article/202602167389i",
    "https://www.hankyung.com/article/2026021677427",
  ];

  console.log("=== 개별 OG 이미지 파싱 테스트 ===\n");

  for (const url of testUrls) {
    console.log(`URL: ${url}`);
    const imageUrl = await fetchOgImage(url);
    console.log(`이미지: ${imageUrl || "없음"}\n`);
  }

  console.log("\n=== 배치 OG 이미지 파싱 테스트 ===\n");

  const imageMap = await fetchOgImagesBatch(testUrls, 2);

  imageMap.forEach((imageUrl, url) => {
    console.log(`URL: ${url}`);
    console.log(`이미지: ${imageUrl || "없음"}\n`);
  });
}

testOgImage().catch(console.error);

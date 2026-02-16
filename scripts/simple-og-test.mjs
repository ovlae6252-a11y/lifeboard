import * as cheerio from "cheerio";

const url = "https://www.hankyung.com/article/202602167759i";

console.log(`테스트 URL: ${url}\n`);

try {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Lifeboard/1.0 (RSS Reader)",
    },
  });

  console.log(`HTTP 상태: ${response.status}`);

  const html = await response.text();
  const $ = cheerio.load(html);

  const ogImage = $('meta[property="og:image"]').attr("content");
  const ogImageUrl = $('meta[property="og:image:url"]').attr("content");
  const twitterImage = $('meta[name="twitter:image"]').attr("content");

  console.log(`og:image = ${ogImage || "없음"}`);
  console.log(`og:image:url = ${ogImageUrl || "없음"}`);
  console.log(`twitter:image = ${twitterImage || "없음"}`);

  const finalImage = ogImage || ogImageUrl || twitterImage;
  console.log(`\n최종 이미지: ${finalImage || "없음"}`);
} catch (error) {
  console.error("에러:", error.message);
}

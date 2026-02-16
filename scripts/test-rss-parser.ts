import Parser from "rss-parser";

const parser = new Parser({
  timeout: 5000,
  headers: {
    "User-Agent": "Lifeboard/1.0 (RSS Reader)",
  },
});

async function testRss() {
  // 한국경제 경제 RSS
  const feedUrl = "https://www.hankyung.com/feed/economy";

  console.log(`RSS 피드 테스트: ${feedUrl}\n`);

  const feed = await parser.parseURL(feedUrl);

  console.log(`피드 제목: ${feed.title}`);
  console.log(`총 아이템 수: ${feed.items.length}\n`);

  // 첫 3개 아이템 상세 정보 출력
  feed.items.slice(0, 3).forEach((item, i) => {
    console.log(`=== 아이템 ${i + 1} ===`);
    console.log(`제목: ${item.title}`);
    console.log(`링크: ${item.link}`);
    console.log(`contentSnippet: ${item.contentSnippet?.substring(0, 100) || "없음"}`);
    console.log(`content: ${item.content?.substring(0, 100) || "없음"}`);
    console.log(`enclosure: ${JSON.stringify(item.enclosure) || "없음"}`);

    // media:content 확인
    const media = item as any;
    console.log(`media:content: ${JSON.stringify(media["media:content"]) || "없음"}`);

    console.log("");
  });
}

testRss().catch(console.error);

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(url, key);

async function checkNewsData() {
  // 1. 이미지가 있는 기사 샘플 조회
  const { data: articlesWithImages } = await supabase
    .from("news_articles")
    .select("id, title, image_url")
    .not("image_url", "is", null)
    .limit(5);

  console.log("\n=== 이미지가 있는 기사 샘플 ===");
  console.log(articlesWithImages);

  // 2. 이미지가 없는 기사 개수
  const { count: noImageCount } = await supabase
    .from("news_articles")
    .select("*", { count: "exact", head: true })
    .is("image_url", null);

  console.log(`\n이미지 없는 기사: ${noImageCount}개`);

  // 3. 최근 뉴스 그룹 샘플 조회
  const { data: recentGroups } = await supabase
    .from("news_article_groups")
    .select(`
      id,
      category,
      fact_summary,
      is_summarized,
      representative_article:news_articles!fk_representative_article (
        title,
        image_url,
        description
      )
    `)
    .eq("is_valid", true)
    .order("created_at", { ascending: false })
    .limit(5);

  console.log("\n=== 최근 뉴스 그룹 샘플 ===");
  console.log(JSON.stringify(recentGroups, null, 2));
}

checkNewsData().catch(console.error);

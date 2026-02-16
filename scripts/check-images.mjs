import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// .env.local 파일 읽기
const envContent = readFileSync(".env.local", "utf-8");
const envVars = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("환경 변수가 설정되지 않았습니다.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// 최근 뉴스 그룹 5개 조회
const { data: groups, error: groupsError } = await supabase
  .from("news_article_groups")
  .select(
    `
    id,
    category,
    representative_article:news_articles!fk_representative_article (
      id,
      title,
      image_url,
      original_url
    )
  `,
  )
  .order("created_at", { ascending: false })
  .limit(5);

if (groupsError) {
  console.error("그룹 조회 오류:", groupsError);
  process.exit(1);
}

console.log(`\n최근 뉴스 그룹 ${groups?.length || 0}개:\n`);

groups?.forEach((group, idx) => {
  const title = group.representative_article?.title || "제목 없음";
  console.log(`${idx + 1}. [${group.category}] ${title.substring(0, 40)}...`);
  console.log(`   그룹 ID: ${group.id}`);
  console.log(`   대표 기사 이미지: ${group.representative_article?.image_url || "없음"}`);
  if (group.representative_article?.image_url) {
    console.log(`   이미지 URL: ${group.representative_article.image_url.substring(0, 80)}...`);
  }
  console.log("");
});

// 이미지가 있는 기사 수 확인
const { count, error: countError } = await supabase
  .from("news_articles")
  .select("*", { count: "exact", head: true })
  .not("image_url", "is", null);

if (!countError) {
  console.log(`\n전체 기사 중 이미지가 있는 기사: ${count}개\n`);
}

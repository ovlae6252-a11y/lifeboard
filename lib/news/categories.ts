// 뉴스 카테고리 상수 (DB의 news_sources.category, news_article_groups.category와 일치)

export interface NewsCategory {
  value: string;
  label: string;
}

export const NEWS_CATEGORIES: NewsCategory[] = [
  { value: "all", label: "전체" },
  { value: "politics", label: "정치" },
  { value: "economy", label: "경제" },
  { value: "society", label: "사회" },
  { value: "culture", label: "생활/문화" },
  { value: "science", label: "IT/과학" },
  { value: "world", label: "세계" },
  { value: "bookmarks", label: "북마크" },
];

/**
 * 카테고리 value로 한국어 라벨을 반환한다.
 * 매칭되지 않으면 value를 그대로 반환.
 */
export function getCategoryLabel(value: string): string {
  const category = NEWS_CATEGORIES.find((c) => c.value === value);
  return category ? category.label : value;
}

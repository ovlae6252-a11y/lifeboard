/**
 * 뉴스 이미지 URL을 반환한다.
 * 우선순위: (1) RSS 제공 image_url -> (2) 카테고리별 기본 이미지 -> (3) 기본 플레이스홀더
 */
export function getNewsImageUrl(
  imageUrl: string | null,
  category: string,
): string {
  // RSS에서 제공한 이미지가 있으면 사용
  if (imageUrl && imageUrl.trim() !== "") {
    return imageUrl;
  }

  // 카테고리별 기본 이미지 매핑
  const categoryImages: Record<string, string> = {
    politics: "/images/categories/politics.svg",
    economy: "/images/categories/economy.svg",
    society: "/images/categories/society.svg",
    culture: "/images/categories/culture.svg",
    science: "/images/categories/science.svg",
    world: "/images/categories/world.svg",
  };

  // 카테고리별 이미지 또는 기본 플레이스홀더
  return categoryImages[category] ?? "/images/categories/default.svg";
}

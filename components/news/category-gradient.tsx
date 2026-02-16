import { getCategoryLabel } from "@/lib/news/categories";

// 카테고리별 gradient 배경 매핑 (chart-1~5 CSS 변수 사용)
const CATEGORY_GRADIENTS: Record<string, string> = {
  politics: "from-chart-1 to-chart-1/60",
  economy: "from-chart-2 to-chart-2/60",
  society: "from-chart-3 to-chart-3/60",
  culture: "from-chart-4 to-chart-4/60",
  science: "from-chart-5 to-chart-5/60",
  world: "from-chart-1 to-chart-1/60",
  all: "from-chart-3 to-chart-3/60",
};

interface CategoryGradientProps {
  category: string;
  className?: string;
}

/**
 * 카테고리별 CSS gradient 배경 컴포넌트.
 * chart-1~5 CSS 변수가 라이트/다크 모두 정의되어 있으므로 다크모드 자동 대응.
 * Server Component.
 */
export function CategoryGradient({
  category,
  className = "",
}: CategoryGradientProps) {
  const gradientClass = CATEGORY_GRADIENTS[category] || CATEGORY_GRADIENTS.all;
  const categoryLabel = getCategoryLabel(category);

  return (
    <div
      className={`bg-gradient-to-br ${gradientClass} ${className}`}
      role="img"
      aria-label={`${categoryLabel} 카테고리 배경`}
    />
  );
}

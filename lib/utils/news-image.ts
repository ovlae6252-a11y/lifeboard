/**
 * 뉴스 이미지 URL 폴백 유틸리티.
 * RSS에서 제공된 image_url이 있으면 우선 사용하고,
 * 없으면 null을 반환하여 CategoryGradient 컴포넌트로 폴백하도록 한다.
 */
export function getNewsImageUrl(imageUrl: string | null): string | null {
  // RSS image_url이 유효하면 그대로 반환
  if (imageUrl && imageUrl.trim().length > 0) {
    return imageUrl;
  }

  // 이미지가 없으면 null 반환 (CategoryGradient로 폴백)
  return null;
}

/**
 * 이미지 URL이 유효한지 검증한다.
 */
export function isValidImageUrl(imageUrl: string | null): boolean {
  if (!imageUrl || imageUrl.trim().length === 0) {
    return false;
  }

  try {
    const url = new URL(imageUrl);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

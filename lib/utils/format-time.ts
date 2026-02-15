/**
 * 날짜 문자열을 상대 시간으로 변환한다.
 * 예: "3시간 전", "어제", "2일 전", "2026.02.14"
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = Date.now();
  const diffMs = now - date.getTime();

  // 유효하지 않은 날짜
  if (isNaN(diffMs)) return dateString;

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "방금 전";
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffHours < 48) return "어제";
  if (diffDays < 7) return `${diffDays}일 전`;

  // 7일 이상이면 YYYY.MM.DD 형식
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

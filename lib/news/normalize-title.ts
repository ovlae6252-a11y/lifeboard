// 뉴스 제목 태그 패턴 (예: [속보], [단독], [화제], [긴급] 등)
const TAG_PATTERN = /\[[\p{L}\p{N}\s]+\]/gu;

// 특수문자 제거 (한글, 영문, 숫자, 공백만 유지)
const SPECIAL_CHAR_PATTERN = /[^\p{L}\p{N}\s]/gu;

// 연속 공백 정리
const MULTI_SPACE_PATTERN = /\s{2,}/g;

// 뉴스 제목 정규화
// - [속보], [단독] 등 태그 제거
// - 특수문자 제거 (한글, 영문, 숫자 보존)
// - 연속 공백 정리
// - 소문자 변환, trim
export function normalizeTitle(title: string): string {
  return title
    .replace(TAG_PATTERN, "")
    .replace(SPECIAL_CHAR_PATTERN, " ")
    .replace(MULTI_SPACE_PATTERN, " ")
    .trim()
    .toLowerCase();
}

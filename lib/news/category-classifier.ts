// RSS 카테고리 태그 및 기사 제목 기반 카테고리 자동 분류

type ValidCategory =
  | "politics"
  | "economy"
  | "society"
  | "culture"
  | "science"
  | "world";

// 한국 언론사 RSS <category> 태그 → 내부 카테고리 매핑
const CATEGORY_MAP: Record<string, ValidCategory> = {
  // 정치
  정치: "politics",
  politics: "politics",
  국내정치: "politics",
  "국내 정치": "politics",
  "정치/국방": "politics",

  // 경제
  경제: "economy",
  economy: "economy",
  금융: "economy",
  산업: "economy",
  부동산: "economy",
  증권: "economy",
  "경제/금융": "economy",
  "산업/기업": "economy",
  비즈니스: "economy",
  business: "economy",
  finance: "economy",
  industry: "economy",
  market: "economy",

  // 사회
  사회: "society",
  society: "society",
  사건: "society",
  사건사고: "society",
  지역: "society",
  생활: "society",
  교육: "society",
  환경: "society",
  건강: "society",
  의료: "society",
  노동: "society",
  "사회/생활": "society",
  local: "society",
  health: "society",
  education: "society",

  // 문화/생활
  문화: "culture",
  culture: "culture",
  연예: "culture",
  스포츠: "culture",
  sports: "culture",
  entertainment: "culture",
  "문화/연예": "culture",
  "라이프/문화": "culture",
  "생활/문화": "culture",
  여행: "culture",
  음식: "culture",
  패션: "culture",

  // IT/과학
  과학: "science",
  science: "science",
  it: "science",
  tech: "science",
  technology: "science",
  "it/과학": "science",
  "과학/it": "science",
  "과학/환경": "science",
  인터넷: "science",
  모바일: "science",
  게임: "science",
  디지털: "science",

  // 세계/국제
  국제: "world",
  세계: "world",
  world: "world",
  international: "world",
  글로벌: "world",
  global: "world",
  해외: "world",
  "국제/외교": "world",
  "세계/국제": "world",
  foreign: "world",
};

// RSS <category> 태그 배열에서 카테고리 자동 분류
// 우선순위: politics > world > economy > science > culture > society
export function classifyFromRssCategories(
  rssCategories: string[] | undefined,
): ValidCategory | null {
  if (!rssCategories || rssCategories.length === 0) return null;

  // 카테고리 문자열을 정규화하여 매핑 시도
  for (const rawCategory of rssCategories) {
    // '>' 또는 '/' 구분자로 분리된 경우 각 부분을 개별 체크
    const parts = rawCategory.split(/[>/]/).map((p) => p.trim().toLowerCase());

    for (const part of parts) {
      if (CATEGORY_MAP[part]) return CATEGORY_MAP[part];
    }

    // 전체 문자열 소문자 매핑 시도
    const normalized = rawCategory.trim().toLowerCase();
    if (CATEGORY_MAP[normalized]) return CATEGORY_MAP[normalized];
  }

  return null;
}

// 제목 키워드 기반 카테고리 분류 (RSS 카테고리 없는 종합 피드용 폴백)
// 우선순위: world > politics > economy > science > culture (society는 소스 기본값으로 처리)
export function classifyFromTitle(title: string): ValidCategory | null {
  if (!title) return null;

  // 세계/국제 뉴스 키워드 (국제 인물/지명/기관)
  const worldPatterns =
    /미국|중국|일본|러시아|유럽|우크라이나|이스라엘|가자|나토|유엔|UN|트럼프|바이든|시진핑|푸틴|북한|한반도|이란|사우디|이스라엘|팔레스타인|아프가니스탄|대만해협|인도|캐나다|호주|영국|독일|프랑스|이탈리아|브라질|멕시코|G7|G20|IMF|WHO|WTO|NATO/;
  if (worldPatterns.test(title)) return "world";

  // 정치 키워드
  const politicsPatterns =
    /대통령|국회|여당|야당|총리|장관|국무|탄핵|선거|민주당|국민의힘|더불어|정부|국무총리|의원|국무회의|헌재|헌법재판소|검찰|법무부|국방부|외교부|청와대|용산|집권|야권|여권|정치|대선|총선|지방선거|비례|공천|임명|인사|내각|총리후보|특검|청문회/;
  if (politicsPatterns.test(title)) return "politics";

  // 경제 키워드
  const economyPatterns =
    /주가|코스피|코스닥|금리|환율|물가|부동산|아파트|주식|채권|수출|무역|GDP|삼성전자|LG|현대차|기아|SK하이닉스|카카오|네이버|취업|실업|경제|기업|산업|투자|증권|은행|금융|보험|무역수지|경상수지|인플레|긴축|적자|흑자|상장|IPO|배당|코인|가상화폐|비트코인|부채|세금|세율|예산|재정/;
  if (economyPatterns.test(title)) return "economy";

  // IT/과학 키워드
  const sciencePatterns =
    /인공지능|AI|반도체|스마트폰|아이폰|갤럭시|챗GPT|ChatGPT|우주|과학|IT|기술|디지털|사이버|해킹|블록체인|클라우드|5G|6G|드론|로봇|자율주행|메타버스|AR|VR|앱|플랫폼|스타트업|빅테크|GPU|딥러닝|머신러닝|오픈AI|엔비디아/;
  if (sciencePatterns.test(title)) return "science";

  // 문화/연예/스포츠 키워드
  const culturePatterns =
    /영화|드라마|음악|K팝|BTS|아이돌|연예|공연|전시|축구|야구|농구|배구|올림픽|아시안게임|월드컵|대회|리그|경기|선수|감독|스포츠|문화|예술|방탄|블랙핑크|뮤지컬|콘서트|골프|테니스|수영|육상|배드민턴|태권도/;
  if (culturePatterns.test(title)) return "culture";

  return null;
}

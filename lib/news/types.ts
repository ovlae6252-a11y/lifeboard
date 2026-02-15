// RSS 파서에서 추출한 원시 기사 데이터
export interface RawArticle {
  guid: string;
  title: string;
  link: string;
  description?: string;
  author?: string;
  pubDate?: string;
  categories?: string[];
  imageUrl?: string;
}

// DB 삽입용 기사 데이터
export interface ArticleInsert {
  source_id: string;
  guid: string;
  title: string;
  title_normalized: string;
  description: string | null;
  original_url: string;
  author: string | null;
  category: string;
  published_at: string | null;
  image_url: string | null;
}

// DB의 뉴스 소스 정보
export interface NewsSource {
  id: string;
  name: string;
  feed_url: string;
  category: string;
  is_active: boolean;
  last_fetched_at: string | null;
}

// 소스별 수집 결과
export interface FetchResult {
  source_id: string;
  source_name: string;
  status: "success" | "error";
  articles_fetched: number;
  articles_new: number;
  error_message?: string;
}

// 그룹핑 결과
export interface GroupingResult {
  article_id: string;
  group_id: string;
  is_new_group: boolean;
}

// API 응답
export interface CollectResponse {
  success: boolean;
  timestamp: string;
  results: FetchResult[];
  summary: {
    total_sources: number;
    successful: number;
    failed: number;
    total_new_articles: number;
    new_groups: number;
  };
}

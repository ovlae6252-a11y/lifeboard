import { notFound } from "next/navigation";
import { Suspense } from "react";

import { NewsDetail } from "@/components/news/news-detail";
import { getNewsGroupDetail, getRelatedArticles } from "@/lib/news/queries";

import NewsDetailLoading from "./loading";

// 빌드 타임 검증을 위한 더미 파라미터 (cacheComponents: true 필수 요구사항)
// 실제 경로는 요청 시 동적 생성됨
export function generateStaticParams() {
  return [{ groupId: "00000000-0000-0000-0000-000000000000" }];
}

interface NewsDetailPageProps {
  params: Promise<{ groupId: string }>;
}

async function NewsDetailContent({
  paramsPromise,
}: {
  paramsPromise: Promise<{ groupId: string }>;
}) {
  const { groupId } = await paramsPromise;

  // 그룹 정보와 관련 기사 병렬 조회
  const [group, relatedArticles] = await Promise.all([
    getNewsGroupDetail(groupId),
    getRelatedArticles(groupId),
  ]);

  // 존재하지 않는 그룹
  if (!group) {
    notFound();
  }

  return <NewsDetail group={group} relatedArticles={relatedArticles} />;
}

export default function NewsDetailPage({ params }: NewsDetailPageProps) {
  return (
    <Suspense fallback={<NewsDetailLoading />}>
      <NewsDetailContent paramsPromise={params} />
    </Suspense>
  );
}

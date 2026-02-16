import { Suspense } from "react";
import type { Metadata } from "next";
import { SettingsContent } from "./settings-content";

export const metadata: Metadata = {
  title: "설정 | Lifeboard",
  description: "계정 설정 및 선호 카테고리를 관리합니다",
};

function SettingsLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">설정</h1>
        <p className="text-muted-foreground mt-2">
          계정 정보와 선호 설정을 관리할 수 있습니다
        </p>
      </div>
      <div className="text-muted-foreground text-sm">로딩 중...</div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsContent />
    </Suspense>
  );
}

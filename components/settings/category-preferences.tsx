"use client";

import { useState } from "react";
import { toast } from "sonner";

import { NEWS_CATEGORIES } from "@/lib/news/categories";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface CategoryPreferencesProps {
  initialCategories: string[];
}

export function CategoryPreferences({
  initialCategories,
}: CategoryPreferencesProps) {
  const [selected, setSelected] = useState<string[]>(initialCategories);
  const [saving, setSaving] = useState(false);

  // "all"과 "bookmarks" 제외한 카테고리만 표시
  const selectableCategories = NEWS_CATEGORIES.filter(
    (cat) => cat.value !== "all" && cat.value !== "bookmarks",
  );

  const handleToggle = (value: string) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const response = await fetch("/api/user/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          preferred_categories: selected,
        }),
      });

      if (!response.ok) {
        throw new Error("설정 저장에 실패했습니다");
      }

      toast.success("설정이 저장되었습니다");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "설정 저장 중 오류가 발생했습니다",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>선호 카테고리</CardTitle>
        <CardDescription>관심 있는 뉴스 카테고리를 선택하세요</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {selectableCategories.map((category) => (
            <div key={category.value} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category.value}`}
                checked={selected.includes(category.value)}
                onCheckedChange={() => handleToggle(category.value)}
              />
              <Label
                htmlFor={`category-${category.value}`}
                className="cursor-pointer text-sm font-normal"
              >
                {category.label}
              </Label>
            </div>
          ))}
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "저장 중..." : "저장"}
        </Button>
      </CardContent>
    </Card>
  );
}

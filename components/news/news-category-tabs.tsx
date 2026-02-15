"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NEWS_CATEGORIES } from "@/lib/news/categories";

export function NewsCategoryTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "all";

  function handleCategoryChange(value: string) {
    if (value === "all") {
      router.push(pathname);
    } else {
      router.push(`${pathname}?category=${value}`);
    }
  }

  return (
    <Tabs value={currentCategory} onValueChange={handleCategoryChange}>
      <TabsList className="w-full justify-start overflow-x-auto">
        {NEWS_CATEGORIES.map((cat) => (
          <TabsTrigger key={cat.value} value={cat.value} className="text-sm">
            {cat.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

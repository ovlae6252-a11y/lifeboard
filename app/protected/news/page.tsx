import { Newspaper } from "lucide-react";

export default function NewsPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20">
      <Newspaper className="h-12 w-12 text-muted-foreground/50" />
      <div className="text-center">
        <h1 className="text-lg font-semibold">뉴스</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          준비 중인 기능입니다. 곧 만나보실 수 있습니다.
        </p>
      </div>
    </div>
  );
}

"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ShareButtonProps {
  groupId: string;
  factSummary: string;
}

export function ShareButton({ groupId, factSummary }: ShareButtonProps) {
  const copyFactSummary = async () => {
    try {
      await navigator.clipboard.writeText(factSummary);
      toast.success("요약이 복사되었습니다");
    } catch (error) {
      console.error("요약 복사 실패:", error);
      toast.error("요약 복사에 실패했습니다");
    }
  };

  const copyLink = async () => {
    try {
      const url = `${window.location.origin}/protected/news/${groupId}`;
      await navigator.clipboard.writeText(url);
      toast.success("링크가 복사되었습니다");
    } catch (error) {
      console.error("링크 복사 실패:", error);
      toast.error("링크 복사에 실패했습니다");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Share2 className="h-4 w-4" />
          <span className="sr-only">공유</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={copyFactSummary}>요약 복사</DropdownMenuItem>
        <DropdownMenuItem onClick={copyLink}>링크 복사</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

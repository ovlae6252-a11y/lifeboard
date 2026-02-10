"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { config } from "@/lib/config"

export function ContactForm() {
  // 제출 완료 다이얼로그 표시 상태
  const [showDialog, setShowDialog] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // 실제로는 API 호출 등 처리
    setShowDialog(true)
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 이름 */}
        <div className="space-y-2">
          <Label htmlFor="name">이름</Label>
          <Input id="name" placeholder="홍길동" required />
        </div>

        {/* 이메일 */}
        <div className="space-y-2">
          <Label htmlFor="email">이메일</Label>
          <Input id="email" type="email" placeholder="hello@example.com" required />
        </div>

        {/* 문의 유형 */}
        <div className="space-y-2">
          <Label htmlFor="inquiry-type">문의 유형</Label>
          <Select required>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="문의 유형을 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {config.contact.inquiryTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 메시지 */}
        <div className="space-y-2">
          <Label htmlFor="message">메시지</Label>
          <Textarea
            id="message"
            placeholder="문의 내용을 입력하세요..."
            className="min-h-32"
            required
          />
        </div>

        <Button type="submit" className="w-full">
          문의 보내기
        </Button>
      </form>

      {/* 제출 완료 다이얼로그 */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>문의가 접수되었습니다</DialogTitle>
            <DialogDescription>
              빠른 시일 내에 입력하신 이메일로 답변 드리겠습니다. 감사합니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowDialog(false)}>확인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

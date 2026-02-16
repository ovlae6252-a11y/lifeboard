import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/news/bookmarks
 * 현재 사용자의 북마크 목록 조회 (group_id 배열 반환)
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    // 북마크 목록 조회 (RLS 정책이 자동으로 user_id 필터링)
    const { data, error } = await supabase
      .from("user_bookmarks")
      .select("group_id")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("북마크 목록 조회 실패:", error.message);
      return NextResponse.json(
        { error: "북마크 목록을 불러올 수 없습니다" },
        { status: 500 },
      );
    }

    // group_id 배열 반환
    const groupIds = data.map((bookmark) => bookmark.group_id);
    return NextResponse.json({ bookmarks: groupIds });
  } catch (error) {
    console.error("북마크 조회 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/news/bookmarks
 * 북마크 추가 (최대 100개 제한)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    // 요청 본문에서 group_id 추출
    const body = await request.json();
    const { group_id } = body;

    if (!group_id || typeof group_id !== "string") {
      return NextResponse.json(
        { error: "group_id가 필요합니다" },
        { status: 400 },
      );
    }

    // 현재 북마크 개수 확인 (100개 제한)
    const { count, error: countError } = await supabase
      .from("user_bookmarks")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("북마크 개수 조회 실패:", countError.message);
      return NextResponse.json(
        { error: "북마크 개수를 확인할 수 없습니다" },
        { status: 500 },
      );
    }

    if (count !== null && count >= 100) {
      return NextResponse.json(
        { error: "북마크는 최대 100개까지만 저장할 수 있습니다" },
        { status: 400 },
      );
    }

    // 북마크 추가 (user_id는 RLS 정책에서 자동으로 설정됨)
    const { error: insertError } = await supabase
      .from("user_bookmarks")
      .insert({ group_id, user_id: user.id });

    if (insertError) {
      // 중복 키 에러 처리 (이미 북마크된 경우)
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "이미 북마크에 추가되었습니다" },
          { status: 409 },
        );
      }

      console.error("북마크 추가 실패:", insertError.message);
      return NextResponse.json(
        { error: "북마크를 추가할 수 없습니다" },
        { status: 500 },
      );
    }

    // 북마크 캐시 무효화 (Next.js 16: Route Handler에서는 revalidateTag 사용)
    revalidateTag("user-bookmarks", "max");
    revalidateTag(user.id, "max");

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("북마크 추가 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/news/bookmarks
 * 북마크 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    // 요청 본문에서 group_id 추출
    const body = await request.json();
    const { group_id } = body;

    if (!group_id || typeof group_id !== "string") {
      return NextResponse.json(
        { error: "group_id가 필요합니다" },
        { status: 400 },
      );
    }

    // 북마크 삭제 (RLS 정책이 user_id 필터링 자동 적용)
    const { error: deleteError } = await supabase
      .from("user_bookmarks")
      .delete()
      .eq("group_id", group_id);

    if (deleteError) {
      console.error("북마크 삭제 실패:", deleteError.message);
      return NextResponse.json(
        { error: "북마크를 삭제할 수 없습니다" },
        { status: 500 },
      );
    }

    // 북마크 캐시 무효화 (Next.js 16: Route Handler에서는 revalidateTag 사용)
    revalidateTag("user-bookmarks", "max");
    revalidateTag(user.id, "max");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("북마크 삭제 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}

import { test, expect } from "@playwright/test";

test.describe("뉴스 검색 기능", () => {
  test("검색바 렌더링 및 검색 기능 테스트", async ({ page }) => {
    // 1. 뉴스 페이지로 이동
    await page.goto("/protected/news");
    await page.waitForLoadState("networkidle");

    // 2. 검색바 존재 확인
    const searchInput = page.getByPlaceholder("뉴스 검색");
    await expect(searchInput).toBeVisible();

    const searchButton = page.getByRole("button", { name: /검색/ });
    await expect(searchButton).toBeVisible();

    // 3. 검색어 입력
    await searchInput.fill("정치");

    // 4. Enter 키로 검색
    await searchInput.press("Enter");

    // 5. URL에 ?q= 파라미터 반영 확인
    await expect(page).toHaveURL(/\?.*q=정치/);

    // 6. 검색 결과 목록 표시 확인 (또는 빈 상태)
    // 뉴스 카드 또는 빈 상태 메시지 중 하나가 표시되어야 함
    const hasResults = await page.locator("article").count();
    const emptyState = page.getByText(/검색 결과가 없습니다/);

    if (hasResults > 0) {
      // 검색 결과가 있는 경우
      console.log(`검색 결과 ${hasResults}개 발견`);
    } else {
      // 검색 결과가 없는 경우
      await expect(emptyState).toBeVisible();
    }
  });

  test("존재하지 않는 키워드 검색 시 빈 상태 표시", async ({ page }) => {
    // 1. 뉴스 페이지로 이동
    await page.goto("/protected/news");
    await page.waitForLoadState("networkidle");

    // 2. 존재하지 않는 키워드로 검색
    const searchInput = page.getByPlaceholder("뉴스 검색");
    await searchInput.fill("zxcvbnmasdfghjkl");
    await searchInput.press("Enter");

    // 3. URL 확인
    await expect(page).toHaveURL(/\?.*q=zxcvbnmasdfghjkl/);

    // 4. 빈 상태 메시지 확인
    await expect(page.getByText(/검색 결과가 없습니다/)).toBeVisible();
    await expect(page.getByText(/다른 키워드로 검색해 보세요/)).toBeVisible();
  });

  test("검색어 클리어 버튼 동작", async ({ page }) => {
    // 1. 뉴스 페이지로 이동
    await page.goto("/protected/news");
    await page.waitForLoadState("networkidle");

    // 2. 검색어 입력
    const searchInput = page.getByPlaceholder("뉴스 검색");
    await searchInput.fill("테스트");

    // 3. X 버튼 확인 (검색어 입력 시 표시됨)
    const clearButton = page.getByRole("button", { name: /검색어 지우기/ });
    await expect(clearButton).toBeVisible();

    // 4. X 버튼 클릭
    await clearButton.click();

    // 5. 검색어가 지워졌는지 확인
    await expect(searchInput).toHaveValue("");

    // 6. URL에서 q 파라미터가 제거되었는지 확인
    await expect(page).not.toHaveURL(/\?.*q=/);
  });

  test("콘솔 에러 없음 확인", async ({ page }) => {
    const consoleErrors: string[] = [];

    // 콘솔 에러 수집
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // 뉴스 페이지 방문 및 검색
    await page.goto("/protected/news");
    await page.waitForLoadState("networkidle");

    const searchInput = page.getByPlaceholder("뉴스 검색");
    await searchInput.fill("테스트");
    await searchInput.press("Enter");

    await page.waitForLoadState("networkidle");

    // 콘솔 에러가 없는지 확인
    expect(consoleErrors).toHaveLength(0);
  });
});

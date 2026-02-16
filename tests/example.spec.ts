import { test, expect } from "@playwright/test";

test("인증된 사용자는 protected 페이지에 접근할 수 있다", async ({ page }) => {
  await page.goto("/protected");
  await expect(page).toHaveURL(/.*protected/);
  await expect(page.locator("h1")).toContainText("대시보드");
});

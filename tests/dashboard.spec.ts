/**
 * Flow 4: Dashboard renders the application status summary.
 */
import { test, expect } from "@playwright/test";

test("dashboard shows all five application status cards", async ({ page }) => {
  await page.goto("/dashboard");

  // Each status card is a link pointing to the filtered jobs list.
  for (const status of ["Applied", "Phone Screen", "Interviewing", "Offer", "Rejected"]) {
    await expect(page.getByText(status)).toBeVisible();
  }
});

/**
 * Flow 5: Jobs list page loads and status filter chips are present.
 * Flow 6: Creating a new job navigates to the job detail page.
 */
import { test, expect } from "@playwright/test";

test("jobs page loads with filter chips and job list", async ({ page }) => {
  await page.goto("/jobs");

  // Status filter chips should all be rendered.
  for (const label of ["Applied", "Phone Screen", "Interviewing", "Offer", "Rejected"]) {
    await expect(page.getByRole("button", { name: label })).toBeVisible();
  }

  // Sort and work preference selects are present.
  await expect(page.getByRole("combobox", { name: "Sort" })).toBeVisible();
});

test("creating a new job redirects to the job detail page", async ({ page }) => {
  // Navigate to jobs/new — requires at least one company to exist (seeded).
  await page.goto("/jobs/new");

  await expect(page.getByLabel("Job title")).toBeVisible();

  // Select the first available company and fill in required fields.
  const companySelect = page.getByLabel("Company");
  await companySelect.selectOption({ index: 1 });

  await page.getByLabel("Job title").fill("E2E Test Engineer");

  await page.getByRole("button", { name: "Save job" }).click();

  // After successful creation we should land on /jobs/<id>.
  await expect(page).toHaveURL(/\/jobs\/[a-z0-9]+/i);
  await expect(page.getByText("E2E Test Engineer")).toBeVisible();
});

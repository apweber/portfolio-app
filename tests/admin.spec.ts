/**
 * Flow 6 (admin): Admin users page lists users with role selects.
 *
 * This test requires the session user to have role=ADMIN.
 * Set PLAYWRIGHT_USER_EMAIL / _PASSWORD to an admin account, or create a
 * separate admin setup project that saves playwright/.auth/admin.json.
 */
import { test, expect } from "@playwright/test";

test("admin users page shows user table with role controls", async ({ page }) => {
  await page.goto("/admin");

  await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();

  // At least one role select should exist (seeded users).
  const roleSelects = page.getByRole("combobox");
  await expect(roleSelects.first()).toBeVisible();
});

test("admin jobs page lists all jobs with delete buttons", async ({ page }) => {
  await page.goto("/admin/jobs");

  await expect(page.getByRole("heading", { name: "All Jobs" })).toBeVisible();

  // Seeded jobs should appear; if the table loads, at least one Delete button exists.
  await expect(page.getByRole("button", { name: "Delete" }).first()).toBeVisible();
});

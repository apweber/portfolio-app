/**
 * Global auth setup: signs in via the login form and saves session cookies
 * so authenticated test projects can reuse them without re-logging in.
 *
 * Required env vars:
 *   PLAYWRIGHT_USER_EMAIL    — test user email (must exist in Supabase auth)
 *   PLAYWRIGHT_USER_PASSWORD — test user password
 */
import { test as setup, expect } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, "../playwright/.auth/user.json");

setup("authenticate as test user", async ({ page }) => {
  const email = process.env.PLAYWRIGHT_USER_EMAIL;
  const password = process.env.PLAYWRIGHT_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Set PLAYWRIGHT_USER_EMAIL and PLAYWRIGHT_USER_PASSWORD to run e2e tests."
    );
  }

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await page.waitForURL("**/dashboard", { timeout: 15_000 });
  await expect(page).toHaveURL(/dashboard/);

  await page.context().storageState({ path: authFile });
});

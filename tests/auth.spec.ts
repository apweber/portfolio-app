/**
 * Flow 1: Login page renders the sign-in form.
 * Flow 2: Register page renders the create-account form.
 * Flow 3: Unauthenticated access to a protected route redirects to /login.
 */
import { test, expect } from "@playwright/test";

test("login page renders email + password fields and sign-in button", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send magic link" })).toBeVisible();
});

test("register page renders create-account form", async ({ page }) => {
  await page.goto("/register");
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
});

test("unauthenticated user visiting /dashboard is redirected to /login", async ({
  browser,
}) => {
  // Create a context with no stored auth to simulate a fresh visitor.
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/login/);
  await context.close();
});

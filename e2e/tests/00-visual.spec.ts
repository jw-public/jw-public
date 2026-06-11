import { test, expect, Page } from "@playwright/test";
import { login } from "./helpers";

// Visual regression net for the BS5 migration: layout breakage (collapsed
// grids, detached input-group buttons, missing card margins) passes every
// functional spec, so the core views are pinned as screenshots.
//
// Runs first (00-): in CI the database is freshly seeded here (admin,
// Standardgruppe, one Test-Termin), which keeps page content deterministic.
// Date-bearing elements are masked — the seeded Termin and the month
// navigation render the current date.
//
// Snapshots are Linux-only and enforced in CI; local runs skip the
// comparisons via `ignoreSnapshots` (see playwright.config.ts). To update:
// let CI fail once and commit the actuals from the test-results artifact.

test.use({ viewport: { width: 1440, height: 900 } });

const screenshotOptions = { fullPage: true };

async function settle(page: Page) {
  // no networkidle: Meteor's livedata connection keeps the network busy
  // forever on some pages, the caller already asserted visible content
  await page.waitForTimeout(800);
}

async function readStandardgruppeId(page: Page): Promise<string> {
  await login(page);
  const href = await page
    .locator("ul#side-menu a[href$='/registrierung']")
    .first()
    .getAttribute("href");
  await page.goto("/logout");
  await expect(page.locator("input#user")).toBeVisible();
  return /\/group\/([^/]+)\/registrierung/.exec(href!)![1];
}

test.describe("Visual regression — core views", () => {
  test("login", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("input#user")).toBeVisible();
    await settle(page);
    await expect(page).toHaveScreenshot("login.png", screenshotOptions);
  });

  test("registration wizard (step 1)", async ({ page }) => {
    const groupId = await readStandardgruppeId(page);
    await page.goto(`/group/${groupId}/registrierung`);
    await expect(page.getByRole("heading", { name: /Registrierung für/ })).toBeVisible();
    await settle(page);
    await expect(page).toHaveScreenshot("registration.png", screenshotOptions);
  });

  test("dashboard", async ({ page }) => {
    await login(page);
    await expect(page.locator("#greeting")).toBeVisible();
    await settle(page);
    await expect(page).toHaveScreenshot("dashboard.png", screenshotOptions);
  });

  test("assignment overview", async ({ page }) => {
    const groupId = await readStandardgruppeId(page);
    await login(page);
    const yearMonth = new Date().toISOString().slice(0, 7);
    await page.goto(`/group/${groupId}/${yearMonth}/overview`);
    await expect(page.locator(".accordion, .alert-info").first()).toBeVisible();
    await settle(page);
    await expect(page).toHaveScreenshot("overview.png", {
      ...screenshotOptions,
      // current date shows up in the header, the month switcher, the week
      // label and the seeded Termin's panel heading
      mask: [
        page.locator("h1.page-header"),
        page.locator("ul.pagination"),
        page.locator(".accordion .card-header h4"),
        page.locator(".assignment-panel .card-header"),
      ],
    });
  });

  test("group management (admin)", async ({ page }) => {
    await login(page);
    await page.goto("/admin/groups");
    await expect(page.getByRole("heading", { name: "Gruppenverwaltung" })).toBeVisible();
    await settle(page);
    await expect(page).toHaveScreenshot("group-management.png", screenshotOptions);
  });

  test("user management (admin)", async ({ page }) => {
    await login(page);
    await page.goto("/admin/users");
    await expect(page.getByRole("heading", { name: "Benutzerverwaltung" })).toBeVisible();
    await settle(page);
    await expect(page).toHaveScreenshot("user-management.png", screenshotOptions);
  });
});

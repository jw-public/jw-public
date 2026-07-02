import { test, expect } from "@playwright/test";
import { login, flowGoto } from "./helpers";

// Smoke coverage for the remaining admin/coordinator pages so every template
// that gets migrated has at least a render-level oracle.

test.describe("Admin & coordinator pages render", () => {
  test("user management lists the admin user", async ({ page }) => {
    await login(page);
    await flowGoto(page, "/admin/users");
    await expect(page.locator("h1.page-header")).toContainText("Benutzerverwaltung", {
      timeout: 20_000,
    });
    await expect(page.locator(".dataTables_wrapper")).toContainText("admin@trolley.com", {
      timeout: 20_000,
    });
  });

  test("unknown routes (incl. removed emailserver page) redirect to the dashboard", async ({
    page,
  }) => {
    // The dead /admin/manage/emailserver route was removed; unknown URLs now
    // hit the catch-all route and land on the dashboard.
    await login(page);
    await flowGoto(page, "/admin/manage/emailserver");
    await expect(page.locator("#greeting")).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveURL(/\/$/);
  });

  test("group members page renders", async ({ page }) => {
    await login(page);
    const href = await page
      .locator("ul#side-menu > li", { has: page.getByText("Gruppe Standardgruppe") })
      .locator("a[href$='/mitglieder']")
      .getAttribute("href");
    await flowGoto(page, href!);
    await expect(page.locator("#page-wrapper")).toContainText("Admin", { timeout: 20_000 });
  });

  test("info site renders", async ({ page }) => {
    await login(page);
    await flowGoto(page, "/info");
    await expect(page.locator("#page-wrapper h1.page-header")).toBeVisible({ timeout: 20_000 });
  });

  test("copy assignments page renders", async ({ page }) => {
    await login(page);
    const href = await page
      .locator("ul#side-menu > li", { has: page.getByText("Gruppe Standardgruppe") })
      .locator("a[href$='/copy-assignments']")
      .getAttribute("href");
    await flowGoto(page, href!);
    await expect(page.locator("#page-wrapper h1.page-header")).toBeVisible({ timeout: 20_000 });
  });

  test("blueprint management page renders", async ({ page }) => {
    await login(page);
    const href = await page
      .locator("ul#side-menu > li", { has: page.getByText("Gruppe Standardgruppe") })
      .locator("a[href$='/manage-assignments']")
      .getAttribute("href");
    const groupId = /\/group\/([^/]+)\//.exec(href!)![1];
    // Characterization: the blueprint page is an unfinished stub.
    await flowGoto(page, `/group/${groupId}/manage-blueprints`);
    await expect(page.locator("#page-wrapper")).toContainText("Not implemented", {
      timeout: 20_000,
    });
  });
});

import { test, expect } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "./helpers";

// Ported from cypress/e2e/login.cy.js
test.describe("Login", () => {
  test("login panel has every input field and logs the admin in", async ({ page }) => {
    await page.goto("/");

    const panel = page.locator("div.panel");
    await expect(panel.locator("input#user")).toBeVisible();
    await expect(panel.locator("input#user")).toBeEnabled();
    await expect(panel.locator("input#password")).toBeVisible();
    await expect(panel.locator("input#password")).toBeEnabled();
    await expect(panel.locator("input#login")).toBeVisible();
    await expect(panel.locator("input#login")).toBeEnabled();

    await panel.locator("input#user").fill(ADMIN_EMAIL);
    await panel.locator("input#password").fill(ADMIN_PASSWORD);
    await panel.locator("#login").click();

    await expect(page.locator("div#page-wrapper #greeting")).toBeVisible();
  });

  test("wrong password keeps the user on the login screen", async ({ page }) => {
    await page.goto("/login");
    await page.locator("input#user").fill(ADMIN_EMAIL);
    await page.locator("input#password").fill("definitely-wrong");
    await page.locator("#login").click();

    // Still on the login screen, no dashboard.
    await expect(page.locator("input#login")).toBeVisible();
    await expect(page.locator("div#page-wrapper")).toHaveCount(0);
  });

  test("logout returns to the login screen", async ({ page }) => {
    await page.goto("/login");
    await page.locator("input#user").fill(ADMIN_EMAIL);
    await page.locator("input#password").fill(ADMIN_PASSWORD);
    await page.locator("#login").click();
    await expect(page.locator("div#page-wrapper")).toBeVisible();

    await page.goto("/logout");
    await expect(page.locator("input#login")).toBeVisible();
  });
});

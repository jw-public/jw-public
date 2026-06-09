import { test, expect } from "@playwright/test";
import { login, uniqueName } from "./helpers";

// Ported from cypress/e2e/createGroup.cy.js
test.describe("Group management (admin)", () => {
  test("admin can create a group via the sidebar", async ({ page }) => {
    await login(page);
    const groupName = uniqueName("test-group");

    const sideMenu = page.locator("ul#side-menu");
    await sideMenu.locator('#adminMenu > [href="#"]').click();
    await sideMenu.locator("#toGroupManagement").click();
    await expect(page).toHaveURL(/\/admin\/groups/);
    await expect(page.locator(".page-header")).toContainText("Gruppenverwaltung");

    const insertPanel = page.locator(".insert-panel > .panel-body");
    await insertPanel.locator("#inputGroupName").fill(groupName);
    await insertPanel.locator("textarea[name='additional']").fill("additional");
    await insertPanel.locator("input[name='email']").fill("mytest@example.org");

    // select2 coordinator dropdown
    await insertPanel.locator("div.select2-container").click();
    await page.locator("div.select2-result-label").first().click();

    await page.locator("#saveButton").click();

    await expect(page.locator(".dataTables_wrapper")).toContainText(groupName);
  });
});

import { test, expect } from "@playwright/test";
import { login, uniqueName, clickSidebarSubmenuEntry } from "./helpers";

// Ported from cypress/e2e/createGroup.cy.js
test.describe("Group management (admin)", () => {
  test("admin can create a group via the sidebar", async ({ page }) => {
    await login(page);
    const groupName = uniqueName("test-group");

    await clickSidebarSubmenuEntry(page, '#adminMenu > [href="#"]', "#toGroupManagement a");
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

    // The admin was chosen as coordinator, so the new group appears reactively
    // in the sidebar. (The tabular DataTable refreshes lazily and is not a
    // stable oracle.)
    await expect(page.locator("ul#side-menu")).toContainText(`Gruppe ${groupName}`, {
      timeout: 15_000,
    });
    await expect(page.locator(".dataTables_wrapper")).toBeVisible();
  });
});

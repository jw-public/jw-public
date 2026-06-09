import { test, expect } from "@playwright/test";
import {
  login,
  uniqueName,
  flowGoto,
  createAssignment,
  expandWeekUntilVisible,
} from "./helpers";

// Single assignment view (/einsatz/:id): an accepted participant clicks their
// panel and sees the detail page with contact persons and info sections.

test.describe("Single assignment view", () => {
  test("accepted participant reaches the detail page from the panel", async ({ page }) => {
    test.setTimeout(120_000);
    const name = uniqueName("e2e-detail");

    await login(page);
    const { groupId, yearMonth } = await createAssignment(page, name);

    await flowGoto(page, `/group/${groupId}/${yearMonth}/overview`);
    const panel = page.locator("div.assignment-panel", { hasText: name });
    await expandWeekUntilVisible(page, panel);
    await panel.getByText("Bewerben").click();
    await expect(panel.getByText("Bewerbung zurückziehen")).toBeVisible({ timeout: 10_000 });

    await panel.locator("button.dropdown-toggle").click();
    await panel.getByText("Abschließen").click();
    const manager = page.locator("#AssignmentManagerModalDialogNode");
    await manager.locator("button.toggle-application").first().click();
    await manager.locator("button.close-application").click();
    await page
      .locator(".bootbox", { hasText: "Abschließen bestätigen" })
      .getByRole("button", { name: "Ja" })
      .click();

    // The accepted panel's footer ("Angenommen.") navigates to the detail view.
    await flowGoto(page, `/group/${groupId}/${yearMonth}/overview`);
    const acceptedPanel = page.locator("div.assignment-panel", { hasText: name });
    await expandWeekUntilVisible(page, acceptedPanel);
    await acceptedPanel.getByText("Angenommen.").click();

    await expect(page).toHaveURL(/\/einsatz\//, { timeout: 15_000 });
    await expect(page.locator("h1.page-header")).toContainText(name, { timeout: 15_000 });
    await expect(page.getByText("Ansprechpersonen").first()).toBeVisible();
    await expect(page.getByText("Informationen").first()).toBeVisible();
    await expect(page.getByText("Admin User").first()).toBeVisible();
  });
});

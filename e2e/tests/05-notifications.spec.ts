import { test, expect } from "@playwright/test";
import {
  login,
  uniqueName,
  flowGoto,
  createAssignment,
  expandWeekUntilVisible,
} from "./helpers";

// Acceptance also produces an in-app notification: bell badge, dropdown entry,
// and "Benachrichtigungen entfernen" clears them.

test.describe("Notifications dropdown", () => {
  test("acceptance creates a notification; clearing removes it", async ({ page }) => {
    test.setTimeout(120_000);
    const name = uniqueName("e2e-notif");

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
      .locator(".app-modal", { hasText: "Abschließen bestätigen" })
      .getByRole("button", { name: "Ja" })
      .click();

    // Bell shows an unread badge; the dropdown lists the acceptance.
    const dropdown = page.locator("#notificationsDropdown");
    await expect(dropdown.locator(".badge-notify")).toBeVisible({ timeout: 15_000 });
    await dropdown.locator("a.dropdown-toggle").click();
    await expect(dropdown.locator(".dropdown-menu")).toContainText(name, { timeout: 10_000 });

    // Clearing removes all notifications and the badge.
    await dropdown.locator("#removeAll").click();
    await expect(dropdown.locator(".badge-notify")).toHaveCount(0, { timeout: 10_000 });
  });
});

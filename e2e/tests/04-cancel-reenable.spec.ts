import { test, expect } from "@playwright/test";
import {
  login,
  uniqueName,
  clearMailbox,
  findMail,
  flowGoto,
  createAssignment,
  expandWeekUntilVisible,
  ADMIN_EMAIL,
} from "./helpers";

// Cancelling an assignment notifies participants ("Absage" email); re-enabling
// it notifies them again that it takes place after all.

test.describe("Assignment cancel & re-enable", () => {
  test("cancel sends Absage email, re-enable notifies again", async ({ page }) => {
    test.setTimeout(120_000);
    const name = uniqueName("e2e-absage");

    await login(page);
    const { groupId, yearMonth } = await createAssignment(page, name);

    // Become an accepted participant so cancellation has someone to notify.
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
    await findMail((m) => m.Subject.includes("Zusage") && m.Subject.includes(name), 20_000);

    // --- Cancel ---------------------------------------------------------------
    await clearMailbox();
    await flowGoto(page, `/group/${groupId}/${yearMonth}/overview`);
    const closedPanel = page.locator("div.assignment-panel", { hasText: name });
    await expandWeekUntilVisible(page, closedPanel);
    await closedPanel.locator("button.dropdown-toggle").click();
    await closedPanel.getByText("Absagen").click();

    // Cancel prompt (bootbox.prompt) asks for a reason.
    const cancelModal = page.locator(".bootbox", { hasText: "Grund für die Terminabsage" });
    await cancelModal.locator(".bootbox-input").fill("Schlechtwetter");
    await cancelModal.getByRole("button", { name: "Akzeptieren" }).click();

    const cancelMail = await findMail(
      (m) => m.Subject.includes("Absage") && m.Subject.includes(name),
      20_000,
    );
    expect(cancelMail.To.map((t) => t.Address)).toContain(ADMIN_EMAIL);

    // Panel shows the cancelled state for the participant.
    await expect(
      page.locator("div.assignment-panel", { hasText: name }).getByText("Abgesagt."),
    ).toBeVisible({ timeout: 15_000 });

    // --- Re-enable -------------------------------------------------------------
    await clearMailbox();
    const canceledPanel = page.locator("div.assignment-panel", { hasText: name });
    await canceledPanel.locator("button.dropdown-toggle").click();
    await canceledPanel.getByText("Termin stattfinden lassen").click();

    const reenableModal = page.locator(".bootbox", { hasText: "Re-Aktivierung" });
    await reenableModal.locator(".bootbox-input").fill("Sonne ist zurück");
    await reenableModal.getByRole("button", { name: "Akzeptieren" }).click();

    // Participants get notified that the assignment takes place again.
    const reenableMail = await findMail((m) => m.Subject.includes(name), 20_000);
    expect(reenableMail.To.map((t) => t.Address)).toContain(ADMIN_EMAIL);
  });
});

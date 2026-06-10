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

// Characterization of the core domain flow: create assignment → apply →
// accept applicant → close (sends the "Zusage" email — the toggle merely
// stages the participant selection).
// The admin user is also a member of "Standardgruppe" (seed data), so it can
// apply on its own group's assignments.

test.describe("Assignment lifecycle", () => {
  test("create → apply → accept → close (Zusage email)", async ({ page }) => {
    test.setTimeout(120_000);
    const name = uniqueName("e2e-termin");

    await login(page);
    const { groupId, yearMonth } = await createAssignment(page, name);
    await expect(page.locator(".dataTables_wrapper")).toBeVisible();

    // --- Apply (as the same logged-in member) -------------------------------
    await clearMailbox();
    await flowGoto(page, `/group/${groupId}/${yearMonth}/overview`);

    const panel = page.locator("div.assignment-panel", { hasText: name });
    await expandWeekUntilVisible(page, panel);

    await panel.getByText("Bewerben").click();
    await expect(panel.getByText("Bewerbung zurückziehen")).toBeVisible({ timeout: 10_000 });

    // --- Accept the applicant (coordinator view) -----------------------------
    // Coordinators reach the manager modal from the panel's admin dropdown
    // ("Abschließen") — same modal as the manage button in the DataTable, but
    // without depending on tabular's lazy refresh.
    await panel.locator("button.dropdown-toggle").click();
    await panel.getByText("Abschließen").click();

    // The manager opens inside the app modal shell.
    const manager = page.locator("#AssignmentManagerModalDialogNode");
    await expect(manager.getByText("Admin User")).toBeVisible({ timeout: 10_000 });
    await manager.locator("button.toggle-application").first().click();

    // --- Close the assignment -------------------------------------------------
    await manager.locator("button.close-application").click();

    // Confirmation dialog: "Der Termin wird geschlossen und den restlichen
    // Bewerbern wird abgesagt."
    const confirmDialog = page.locator(".app-modal", { hasText: "Abschließen bestätigen" });
    await confirmDialog.getByRole("button", { name: "Ja" }).click();

    const mail = await findMail(
      (m) => m.Subject.includes("Zusage") && m.Subject.includes(name),
      20_000,
    );
    expect(mail.To.map((t) => t.Address)).toContain(ADMIN_EMAIL);

    // --- Closed state on the overview ----------------------------------------
    await flowGoto(page, `/group/${groupId}/${yearMonth}/overview`);
    const closedPanel = page.locator("div.assignment-panel", { hasText: name });
    await expandWeekUntilVisible(page, closedPanel);
    // The accepted participant sees "Angenommen." (non-participants would see
    // "Termin ist geschlossen.").
    await expect(closedPanel.getByText("Angenommen.")).toBeVisible({ timeout: 10_000 });
  });
});

import { test, expect, Page } from "@playwright/test";
import { login, uniqueName, clearMailbox, findMail, flowGoto, ADMIN_EMAIL } from "./helpers";

// Characterization of the core domain flow: create assignment → apply →
// accept applicant (sends "Zusage" email) → close assignment.
// The admin user is also a member of "Standardgruppe" (seed data), so it can
// apply on its own group's assignments.

async function gotoManageAssignments(page: Page): Promise<string> {
  // Open the group submenu in the sidebar and follow "Einsätze verwalten",
  // scoped to Standardgruppe (other groups may exist from earlier runs).
  // Retry against metismenu re-render collapses.
  const groupEntry = page.locator("ul#side-menu > li", {
    has: page.getByText("Gruppe Standardgruppe"),
  });
  for (let attempt = 0; attempt < 5; attempt++) {
    await groupEntry.locator("> a").click();
    try {
      await groupEntry.getByText("Einsätze verwalten").click({ timeout: 3_000 });
      break;
    } catch {
      // submenu collapsed again — retry
    }
  }
  await expect(page).toHaveURL(/\/group\/[^/]+\/manage-assignments/);
  const groupId = /\/group\/([^/]+)\/manage-assignments/.exec(page.url())![1];
  await expect(page.locator("h1.page-header")).toContainText("Einsätze");
  return groupId;
}

// Week accordions render lazily ({{#if render}}), so each one has to be
// opened until the wanted panel appears. Subscriptions may still be loading
// on direct navigation — retry over a few rounds.
async function expandWeekUntilVisible(page: Page, panel: ReturnType<Page["locator"]>) {
  await expect(page.locator("#accordion")).toBeVisible({ timeout: 15_000 });
  for (let round = 0; round < 10; round++) {
    if (await panel.isVisible()) return;
    const headings = page.locator("#accordion .panel-heading");
    const count = await headings.count();
    for (let i = 0; i < count; i++) {
      if (await panel.isVisible()) return;
      await headings.nth(i).click();
      await page.waitForTimeout(400);
    }
    await page.waitForTimeout(500);
  }
  await expect(panel).toBeVisible();
}

test.describe("Assignment lifecycle", () => {
  test("create → apply → accept (email) → close", async ({ page }) => {
    test.setTimeout(120_000);
    const name = uniqueName("e2e-termin");

    await login(page);
    const groupId = await gotoManageAssignments(page);

    // --- Create -------------------------------------------------------------
    const form = page.locator("form#assignmentForm");
    await form.locator("input[name='name']").fill(name);
    await form.locator("input[name='userGoal']").fill("2");
    // "Ansprechpersonen" (contacts) is required: pick the admin via select2.
    // The field only renders once subscriptions are ready.
    await form.locator(".select2-container").click();
    await page.locator("div.select2-result-label").first().click();
    await expect(form.locator(".select2-search-choice")).toHaveCount(1);
    // The inline datetimepicker preselects a default start; the overview month
    // must be derived from it (it can roll over into the next month).
    await expect(form.locator("input[name='start']")).not.toHaveValue("");
    const startValue = await form.locator("input[name='start']").inputValue();
    const start = new Date(startValue);
    const yearMonth = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;

    await form.locator("button.submit-change").click();
    // resetOnSuccess=true clears the form — the reliable success signal.
    // (The tabular DataTable updates lazily and is not a stable oracle.)
    await expect(form.locator("input[name='name']")).toHaveValue("", { timeout: 15_000 });
    // The DataTable itself is still asserted to render.
    await expect(page.locator(".dataTables_wrapper")).toBeVisible();

    // --- Apply (as the same logged-in member) -------------------------------
    await clearMailbox();
    await flowGoto(page, `/group/${groupId}/${yearMonth}/overview`);

    // Expand all week accordions until our assignment's panel is visible.
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

    // The manager opens inside a bootbox modal.
    const manager = page.locator("#AssignmentManagerModalDialogNode");
    await expect(manager.getByText("Admin User")).toBeVisible({ timeout: 10_000 });
    await manager.locator("button.toggle-application").first().click();

    // --- Close the assignment -------------------------------------------------
    // The "Zusage" email is only sent when the assignment is closed — the
    // toggle merely stages the participant selection.
    await manager.locator("button.close-application").click();

    // Confirmation dialog: "Der Termin wird geschlossen und den restlichen
    // Bewerbern wird abgesagt."
    const confirmDialog = page.locator(".bootbox", { hasText: "Abschließen bestätigen" });
    await confirmDialog.getByRole("button", { name: "Ja" }).click();

    const mail = await findMail(
      (m) => m.Subject.includes("Zusage") && m.Subject.includes(name),
      20_000,
    );
    expect(mail.To.map((t) => t.Address)).toContain(ADMIN_EMAIL);
    // Closing is reflected in the overview: the panel shows the closed state.
    await flowGoto(page, `/group/${groupId}/${yearMonth}/overview`);
    const closedPanel = page.locator("div.assignment-panel", { hasText: name });
    await expandWeekUntilVisible(page, closedPanel);
    // The accepted participant sees "Angenommen." (non-participants would see
    // "Termin ist geschlossen.").
    await expect(closedPanel.getByText("Angenommen.")).toBeVisible({ timeout: 10_000 });
  });
});

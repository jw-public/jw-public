import { test, expect, Page } from "@playwright/test";
import { expandWeekUntilVisible } from "./helpers";

// End-to-end smoke test of the core trolley flow. Runs in the normal suite
// (default seed admin) AND can be pointed at a real instance with your own
// account via env vars:
//
//   E2E_BASE_URL=https://jw-public.org \
//   SMOKE_EMAIL=you@example.org SMOKE_PASSWORD=... \
//   npx playwright test 13-smoketest
//
// What it does (idempotent, self-cleaning):
//   1. ensure a dedicated test group exists (reuse if present), make the user
//      its coordinator + member
//   2. create an upcoming test assignment (unique id) in that group
//   3. dashboard: the blue "Termine in <group>" tile is present -> click it
//   4. overview: apply to the assignment
//   5. accept it (Abschließen)
//   6. cancel it (Absagen)
//   7. cleanup: delete the assignment (the group is kept)

const EMAIL = process.env.SMOKE_EMAIL ?? "admin@trolley.com";
const PASSWORD = process.env.SMOKE_PASSWORD ?? "admin3210";
// Fixed, valid-format group id keeps the test group idempotent across runs.
const GROUP_ID = process.env.SMOKE_GROUP_ID ?? "smoketestgroupAAA";
const GROUP_NAME = process.env.SMOKE_GROUP_NAME ?? "Smoketest E2E";

// Meteor id alphabet (no 0/1/l/I/O...), 17 chars.
const ID_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz";
function meteorId(prefix = ""): string {
  let id = prefix;
  while (id.length < 17) id += ID_ALPHABET[Math.floor(Math.random() * ID_ALPHABET.length)];
  return id.slice(0, 17);
}

// Shared with the afterAll cleanup so a mid-test failure still removes the term.
let createdAssignmentId: string | null = null;

async function smokeLogin(page: Page): Promise<void> {
  await page.goto("/login");
  await page.locator("input#user").fill(EMAIL);
  await page.locator("input#password").fill(PASSWORD);
  await page.locator("#login").click();

  const wrapper = page.locator("div#page-wrapper");
  const gate = page.locator("#terms-consent-gate");
  await expect(wrapper.or(gate)).toBeVisible({ timeout: 20_000 });
  // Existing accounts without (current) terms consent hit the gate first.
  if (await gate.isVisible()) {
    await page.locator("input#acceptTermsCheckbox").check();
    await page.locator("button.accept-terms").click();
  }
  await expect(wrapper).toBeVisible({ timeout: 20_000 });
}

test.describe("Smoke", () => {
  test("core flow: create → dashboard tile → apply → accept → cancel → cleanup", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const assignmentName = `smoke-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 6)}`;
    createdAssignmentId = meteorId("smoke");

    await smokeLogin(page);

    // --- 1+2: idempotent group + membership + upcoming assignment (via DDP) ---
    const setup = await page.evaluate(
      async ({ groupId, groupName, assignmentName, assignmentId }) => {
        const M = (window as any).Meteor;
        const uid: string = M.userId();
        if (!(await M.callAsync("groupExists", groupId))) {
          await M.callAsync("/groups/insertAsync", {
            _id: groupId,
            name: groupName,
            additional: "Automated smoke test group",
            coordinators: [uid],
            creator: uid,
          });
        }
        // self as member (idempotent; needs coordinator/admin rights)
        await M.callAsync("addToGroup", uid, groupId);

        // Upcoming, current-month assignment so it shows under the dashboard
        // tile's overview link and counts toward the tile.
        const start = new Date();
        start.setHours(start.getHours() + 2, 0, 0, 0);
        const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
        await M.callAsync("/assignments/insertAsync", {
          _id: assignmentId,
          name: assignmentName,
          group: groupId,
          start,
          end,
          contacts: [uid],
        });
        return { uid };
      },
      { groupId: GROUP_ID, groupName: GROUP_NAME, assignmentName, assignmentId: createdAssignmentId },
    );
    expect(setup.uid).toBeTruthy();

    // --- 3: dashboard blue tile + click ---
    await page.goto("/");
    await expect(page.locator("#greeting")).toBeVisible({ timeout: 20_000 });
    const tile = page.locator("#page-wrapper .card", { hasText: `Termine in ${GROUP_NAME}` });
    await expect(tile).toBeVisible({ timeout: 20_000 });
    await tile.locator("a[href*='/overview']").click();
    await expect(page).toHaveURL(/\/overview/, { timeout: 20_000 });

    // --- 4: apply ---
    const panel = page.locator("div.assignment-panel", { hasText: assignmentName });
    await expandWeekUntilVisible(page, panel);
    await panel.getByText("Bewerben").click();
    await expect(panel.getByText("Bewerbung zurückziehen")).toBeVisible({ timeout: 10_000 });

    // --- 5: accept (Abschließen) ---
    await panel.locator("button.dropdown-toggle").click();
    await panel.getByText("Abschließen").click();
    const manager = page.locator("#AssignmentManagerModalDialogNode");
    await manager.locator("button.toggle-application").first().click();
    await manager.locator("button.close-application").click();
    await page
      .locator(".app-modal", { hasText: "Abschließen bestätigen" })
      .getByRole("button", { name: "Ja" })
      .click();
    await expect(panel.getByText("Angenommen.")).toBeVisible({ timeout: 15_000 });

    // --- 6: cancel (Absagen) ---
    await panel.locator("button.dropdown-toggle").click();
    await panel.getByText("Absagen").click();
    const cancelModal = page.locator(".app-modal", { hasText: "Grund für die Terminabsage" });
    await cancelModal.locator("input.app-modal-input").fill("Smoke-Test Absage");
    await cancelModal.locator("button.btn-primary").click();
    await expect(panel.getByText("Abgesagt.")).toBeVisible({ timeout: 15_000 });
  });
});

// Always remove the created assignment (group is intentionally kept), even if
// the test failed partway through.
test.afterAll(async ({ browser }) => {
  if (!createdAssignmentId) return;
  const page = await browser.newPage();
  try {
    await smokeLogin(page);
    // removeAssignment deletes the doc first, then notifies; the "Removed"
    // notification step can throw harmlessly after the delete already happened,
    // so a thrown error here does NOT mean the cleanup failed.
    await page.evaluate(async (id) => {
      try {
        await (window as any).Meteor.callAsync("removeAssignment", id);
      } catch (e) {
        console.warn("[smoke cleanup] removeAssignment threw after delete:", e);
      }
    }, createdAssignmentId);
  } finally {
    await page.close();
  }
});

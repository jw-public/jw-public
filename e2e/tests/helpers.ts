import { Page, expect } from "@playwright/test";

export const ADMIN_EMAIL = "admin@trolley.com";
export const ADMIN_PASSWORD = "admin3210";

const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://localhost:18025";

export async function login(page: Page, email = ADMIN_EMAIL, password = ADMIN_PASSWORD) {
  await page.goto("/login");
  await page.locator("input#user").fill(email);
  await page.locator("input#password").fill(password);
  await page.locator("#login").click();
  // Successful login lands on the dashboard inside the main layout.
  await expect(page.locator("div#page-wrapper")).toBeVisible();
}

// Since the react-router migration every route survives a cold page load
// (the guards wait for auth/roles instead of redirecting too early), so this
// is a plain navigation now. The name stays for spec readability.
export async function flowGoto(page: Page, path: string): Promise<void> {
  await page.goto(path);
}

// The metismenu sidebar re-initializes on reactive re-renders, which can
// collapse a submenu mid-animation. Open the submenu and click the entry
// with retries instead of assuming it stays open.
export async function clickSidebarSubmenuEntry(
  page: Page,
  toggleSelector: string,
  entrySelector: string,
): Promise<void> {
  const sideMenu = page.locator("ul#side-menu");
  for (let attempt = 0; attempt < 5; attempt++) {
    await sideMenu.locator(toggleSelector).click();
    try {
      await sideMenu.locator(entrySelector).click({ timeout: 3_000 });
      return;
    } catch {
      // submenu collapsed again — retry
    }
  }
  await sideMenu.locator(entrySelector).click({ timeout: 5_000 });
}

export function uniqueName(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

// --- Domain flows --------------------------------------------------------------

// Creates an assignment in Standardgruppe via the coordinator form and returns
// the ids needed to find it on the overview. Expects an admin session.
export async function createAssignment(page: Page, name: string): Promise<{ groupId: string; yearMonth: string }> {
  const groupEntry = page.locator("ul#side-menu > li", {
    has: page.getByText("Gruppe Standardgruppe"),
  });
  for (let attempt = 0; attempt < 5; attempt++) {
    await groupEntry.locator("> a").click();
    try {
      await groupEntry.getByText("Einsätze verwalten").click({ timeout: 3_000 });
      break;
    } catch {
      // metismenu collapsed mid-animation — retry
    }
  }
  await expect(page).toHaveURL(/\/group\/[^/]+\/manage-assignments/);
  const groupId = /\/group\/([^/]+)\/manage-assignments/.exec(page.url())![1];

  const form = page.locator("form#assignmentForm");
  await form.locator("input[name='name']").fill(name);
  await form.locator("input[name='userGoal']").fill("2");
  await form.locator("input[name='pickup_point']").fill("Abholpunkt-Test");
  await form.locator("input[name='return_point']").fill("Rückgabepunkt-Test");
  // react-select contacts field (replaced autoform-select2 in the migration)
  await form.locator("input#assignmentContacts").fill("Admin");
  await form.locator("input#assignmentContacts").press("Enter");
  await expect(form.locator("input[name='start']")).not.toHaveValue("");
  const start = new Date(await form.locator("input[name='start']").inputValue());
  const yearMonth = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
  await form.locator("button.submit-change").click();
  await expect(form.locator("input[name='name']")).toHaveValue("", { timeout: 15_000 });

  return { groupId, yearMonth };
}

// Opens the week accordions on the overview until the panel is visible.
export async function expandWeekUntilVisible(
  page: Page,
  panel: ReturnType<Page["locator"]>,
): Promise<void> {
  await expect(page.locator("#accordion")).toBeVisible({ timeout: 15_000 });
  for (let round = 0; round < 10; round++) {
    if (await panel.isVisible()) return;
    const headings = page.locator("#accordion .card-header");
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

// --- Mailpit -----------------------------------------------------------------

export async function clearMailbox(): Promise<void> {
  await fetch(`${MAILPIT_URL}/api/v1/messages`, { method: "DELETE" });
}

export interface MailpitMessage {
  ID: string;
  To: { Address: string }[];
  Subject: string;
  Snippet: string;
}

export async function findMail(
  predicate: (m: MailpitMessage) => boolean,
  timeoutMs = 15_000,
): Promise<MailpitMessage> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const res = await fetch(`${MAILPIT_URL}/api/v1/messages?limit=50`);
    const body = (await res.json()) as { messages: MailpitMessage[] };
    const hit = body.messages?.find(predicate);
    if (hit) return hit;
    if (Date.now() > deadline) {
      throw new Error(
        `No matching mail in Mailpit within ${timeoutMs}ms. Got subjects: ${body.messages
          ?.map((m) => m.Subject)
          .join(" | ")}`,
      );
    }
    await new Promise((r) => setTimeout(r, 500));
  }
}

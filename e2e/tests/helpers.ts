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

// Client-side navigation via FlowRouter. Cold page loads of some routes are
// broken in the legacy app (blank page on /manage-assignments, role-trigger
// redirect on /admin/*), so tests navigate the way real users do.
export async function flowGoto(page: Page, path: string): Promise<void> {
  await page.evaluate((p) => {
    (window as any).Package["ostrio:flow-router-extra"].FlowRouter.go(p);
  }, path);
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

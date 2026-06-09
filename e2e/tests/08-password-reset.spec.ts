import { test, expect } from "@playwright/test";
import { clearMailbox, findMail, ADMIN_EMAIL, ADMIN_PASSWORD } from "./helpers";

const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://localhost:18025";

// Forgot-password flow: request reset mail, follow the link, set a new
// password (the same one, to keep the shared admin account stable), log in.

test.describe("Password reset", () => {
  test("reset mail arrives and the token link sets a new password", async ({ page }) => {
    test.setTimeout(120_000);
    await clearMailbox();

    await page.goto("/login");
    await page.locator("a.forgot_link").click();
    const modal = page.locator("#forgottenPasswordModal");
    await expect(modal).toBeVisible();
    await modal.locator("input#email").fill(ADMIN_EMAIL);
    await modal.locator("form.forgotPassword button[type='submit']").click();

    const mail = await findMail(
      (m) => m.Subject.includes("Passwort") && m.To.some((t) => t.Address === ADMIN_EMAIL),
      20_000,
    );

    // Extract the reset token from the mail body (the URL may be line-wrapped,
    // so match the token rather than the full link).
    const bodyRes = await fetch(`${MAILPIT_URL}/api/v1/message/${mail.ID}`);
    const body = (await bodyRes.json()) as { Text: string };
    const tokenMatch = /reset-password\/([A-Za-z0-9_-]+)/.exec(body.Text);
    expect(tokenMatch, `no reset token in mail body: ${body.Text.slice(0, 300)}`).toBeTruthy();

    await page.goto(`/reset-password/${tokenMatch![1]}`);
    await expect(page.locator("input#password")).toBeVisible({ timeout: 20_000 });
    await page.locator("input#password").fill(ADMIN_PASSWORD);
    await page.locator("input#reset").click();

    // Setting the password logs the user in.
    await expect(page.locator("div#page-wrapper")).toBeVisible({ timeout: 20_000 });

    // And a fresh login with the password still works.
    await page.goto("/logout");
    await expect(page.locator("input#login")).toBeVisible();
    await page.locator("input#user").fill(ADMIN_EMAIL);
    await page.locator("input#password").fill(ADMIN_PASSWORD);
    await page.locator("#login").click();
    await expect(page.locator("div#page-wrapper")).toBeVisible({ timeout: 15_000 });
  });
});

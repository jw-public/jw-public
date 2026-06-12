import { test, expect, Page } from "@playwright/test";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  login,
  readStandardgruppeId,
  registerUserInGroup,
  uniqueName,
} from "./helpers";

// Login-consent gate: an existing account without (current) terms-of-use
// consent must accept the terms on the next login before reaching the app.
//
// The spec builds its own "legacy" account: it registers a fresh user (which
// records consent), then removes the consent server-side through an
// admin-session client update — exactly the state of accounts created before
// the terms were introduced.

async function loginExpectingGate(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/login");
  await page.locator("input#user").fill(email);
  await page.locator("input#password").fill(password);
  await page.locator("#login").click();
  await expect(page.locator("#terms-consent-gate")).toBeVisible({ timeout: 20_000 });
}

async function logout(page: Page): Promise<void> {
  await page.goto("/logout");
  await expect(page.locator("input#login")).toBeVisible();
}

test.describe("Terms of use consent gate", () => {
  test("legacy user must consent at login before reaching the app", async ({ page }) => {
    test.setTimeout(120_000);
    const id = uniqueName("legacy");
    const email = `${id}@example.org`;
    const password = "test-passwort-123";

    const groupId = await readStandardgruppeId(page);

    // --- Create the account (records consent) and capture its id -------------
    await registerUserInGroup(page, groupId, email, password, "Lena", "Altbestand");
    const userId = await page.evaluate(() => (window as any).Meteor.userId() as string);
    await logout(page);

    // --- Simulate a pre-terms account: admin removes the consent --------------
    await login(page);
    await page.evaluate(async (targetId) => {
      const M = (window as any).Meteor;
      await M.users.updateAsync({ _id: targetId }, { $unset: { termsOfUse: "" } });
    }, userId);
    await logout(page);

    // --- Next login runs into the gate; the app stays blocked -----------------
    await loginExpectingGate(page, email, password);
    await expect(page.locator("div#page-wrapper #greeting")).toHaveCount(0);
    await expect(page.locator("button.accept-terms")).toBeDisabled();

    // Declining logs the user out without recording consent.
    await page.locator("a.decline-terms").click();
    await expect(page.locator("input#login")).toBeVisible({ timeout: 20_000 });
    await loginExpectingGate(page, email, password);

    // --- Accepting unblocks the app reactively --------------------------------
    await page.locator("input#acceptTermsCheckbox").check();
    await page.locator("button.accept-terms").click();
    await expect(page.locator("div#page-wrapper #greeting")).toBeVisible({ timeout: 20_000 });
    await logout(page);

    // --- Consent is persistent: the next login skips the gate -----------------
    await login(page, email, password);
    await expect(page.locator("#terms-consent-gate")).toHaveCount(0);
  });

  test("admin with recorded consent never sees the gate", async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await expect(page.locator("#terms-consent-gate")).toHaveCount(0);
    await expect(page.locator("div#page-wrapper #greeting")).toBeVisible({ timeout: 20_000 });
  });

  test("terms of use page is publicly reachable", async ({ page }) => {
    await page.goto("/nutzungsbedingungen");
    await expect(page.locator("h1.page-header")).toContainText("Nutzungsbedingungen", {
      timeout: 20_000,
    });
    await expect(page.getByText("Verarbeitung personenbezogener Daten")).toBeVisible();
  });
});

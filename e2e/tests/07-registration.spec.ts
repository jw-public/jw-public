import { test, expect, Page } from "@playwright/test";
import { login, uniqueName, flowGoto, clickSidebarSubmenuEntry } from "./helpers";

// Self-registration in a group (two-step wizard) followed by the coordinator
// accepting the applicant ("Offene Gruppenbewerbungen").

async function readStandardgruppeId(page: Page): Promise<string> {
  await login(page);
  const href = await page
    .locator("ul#side-menu > li", { has: page.getByText("Gruppe Standardgruppe") })
    .locator("a[href$='/registrierung']")
    .getAttribute("href");
  await page.goto("/logout");
  await expect(page.locator("input#login")).toBeVisible();
  return /\/group\/([^/]+)\/registrierung/.exec(href!)![1];
}

test.describe("Registration", () => {
  test("user registers in a group and is accepted by the coordinator", async ({ page }) => {
    test.setTimeout(120_000);
    const id = uniqueName("user");
    const email = `${id}@example.org`;
    const password = "test-passwort-123";

    const groupId = await readStandardgruppeId(page);

    // --- Two-step registration wizard ----------------------------------------
    await page.goto(`/group/${groupId}/registrierung`);
    await expect(page.locator("h1.page-header")).toContainText("Registrierung", {
      timeout: 20_000,
    });

    await page.locator("input[name='email']").fill(email);
    await page.locator("button.next-button-registration").click();

    await expect(page.getByText("Nur noch ein Schritt!")).toBeVisible({ timeout: 10_000 });
    await page.locator("input[name='profile.first_name']").fill("Erika");
    await page.locator("input[name='profile.last_name']").fill("Musterfrau");
    // Gender radio (select-radio-inline)
    await page.locator("input[name='profile.gender']").first().check();
    await page.locator("input[name='profile.mobile']").fill("+49 170 1234567");
    await page.locator("input[name='profile.placeName']").fill("Erding");
    await page.locator("input[name='profile.zip']").fill("85435");
    await page.locator("input[name='password']").fill(password);
    await page.locator("input[name='passwordConfirmation']").fill(password);
    await page.locator("button.submit-change").click();

    // Registration logs the new user in and lands on the dashboard.
    await expect(page.locator("div#page-wrapper #greeting")).toBeVisible({ timeout: 20_000 });

    // --- Coordinator accepts the applicant -----------------------------------
    await page.goto("/logout");
    await expect(page.locator("input#login")).toBeVisible();
    await login(page);

    await flowGoto(page, `/group/${groupId}/bewerber`);
    await expect(page.locator("h1.page-header")).toContainText("Bewerbungen", { timeout: 20_000 });
    const row = page.locator(".dataTables_wrapper tr", { hasText: "Musterfrau" });
    await row.locator("button.accept-user").click();

    // The applicant disappears from the table once accepted.
    await expect(page.locator(".dataTables_wrapper tr", { hasText: "Musterfrau" })).toHaveCount(0, {
      timeout: 15_000,
    });

    // --- The new user is now a member ----------------------------------------
    await page.goto("/logout");
    await expect(page.locator("input#login")).toBeVisible();
    await login(page, email, password);
    await expect(page.locator("div#page-wrapper #greeting")).toContainText("Erika", {
      timeout: 15_000,
    });
  });
});

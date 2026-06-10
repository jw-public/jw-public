import { test, expect } from "@playwright/test";
import { login, flowGoto, uniqueName } from "./helpers";

// Profile page: update a field, persist, and see it after reload.

test.describe("Profile", () => {
  test("changing the place name persists", async ({ page }) => {
    const newPlace = uniqueName("Ort");

    await login(page);
    await flowGoto(page, "/my-profile");
    await expect(page.locator("h1.page-header")).toContainText("Profil");

    const form = page.locator("form").filter({ has: page.locator("input[name='profile.placeName']") }).first();
    await form.locator("input[name='profile.placeName']").fill(newPlace);
    await form.locator("button.submit-change").click();
    await expect(form.getByText("Dein Profil wurde gespeichert.")).toBeVisible({ timeout: 10_000 });

    // Reload (full page) and verify persistence.
    await page.goto("/my-profile");
    await expect(page.locator("input[name='profile.placeName']")).toHaveValue(newPlace, {
      timeout: 20_000,
    });
  });
});

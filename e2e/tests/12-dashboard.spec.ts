import { test, expect } from "@playwright/test";
import { login } from "./helpers";

// The dashboard must show a "Termine in <group>" card for every group the
// logged-in user is a member of. The admin is seeded as a member of
// "Standardgruppe", so its card must be present.
//
// Regression guard: the card silently disappeared because the dashboard gated
// the trolley panels on getUserDataSubscription(), whose subscription was set
// up in a Tracker.autorun that got torn down when React's useTracker re-ran,
// leaving ready() permanently false. (Whether the card carries a link depends
// on the upcoming-assignment count and is intentionally separate.)

test.describe("Dashboard", () => {
  test("shows a Termine card for a group the user is a member of", async ({ page }) => {
    await login(page);
    await expect(page.locator("#greeting")).toBeVisible();

    await expect(
      page.locator("#page-wrapper .card", { hasText: "Termine in Standardgruppe" }),
    ).toBeVisible({ timeout: 15_000 });
  });
});

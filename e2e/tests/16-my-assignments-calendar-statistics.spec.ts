import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import {
  login,
  flowGoto,
  uniqueName,
  createAssignment,
  expandWeekUntilVisible,
} from "./helpers";

// Die vier neuen Ansichten: persönliche Terminübersicht, Kalenderansicht mit
// Tagesfilter, Admin-Statistik und CSV-Export.

test.describe("Meine Termine", () => {
  test("shows an assignment the user applied for, across months and groups", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const name = uniqueName("e2e-meinetermine");

    await login(page);
    const { groupId, yearMonth } = await createAssignment(page, name);

    // Ohne Bewerbung ist der Termin nicht "meiner".
    await flowGoto(page, "/meine-termine");
    await expect(page.locator("h1.page-header")).toContainText(
      "Meine Termine",
      {
        timeout: 20_000,
      },
    );
    await expect(page.locator("#page-wrapper")).not.toContainText(name);

    await flowGoto(page, `/group/${groupId}/${yearMonth}/overview`);
    const panel = page.locator("div.assignment-panel", { hasText: name });
    await expandWeekUntilVisible(page, panel);
    await panel.getByText("Bewerben").click();
    await expect(panel.getByText("Bewerbung zurückziehen")).toBeVisible({
      timeout: 10_000,
    });

    await flowGoto(page, "/meine-termine");
    await expect(
      page.locator("div.assignment-panel", { hasText: name }),
    ).toBeVisible({
      timeout: 20_000,
    });
    // Die Herkunftsgruppe steht über dem Block.
    await expect(page.locator("#page-wrapper")).toContainText(
      "Standardgruppe",
      {
        timeout: 20_000,
      },
    );
  });

  test("is reachable from the sidebar", async ({ page }) => {
    await login(page);
    await page.locator("#toMyAssignments").click();
    await expect(page).toHaveURL(/\/meine-termine$/);
  });
});

test.describe("Kalenderansicht", () => {
  test("switching to the calendar and picking a day filters the assignments", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const name = uniqueName("e2e-kalender");

    await login(page);
    const { groupId, yearMonth } = await createAssignment(page, name);
    await flowGoto(page, `/group/${groupId}/${yearMonth}/overview`);

    await page.locator("#view-calendar").locator("..").click();
    const grid = page.locator(".assignment-calendar-grid");
    await expect(grid).toBeVisible({ timeout: 20_000 });

    // Ohne Tagesauswahl zeigt die Liste alle Termine des Monats.
    await expect(
      page.locator("div.assignment-panel", { hasText: name }),
    ).toBeVisible({
      timeout: 20_000,
    });

    // Ein Tag ohne Termine blendet den Termin aus.
    const emptyDay = grid
      .locator(".assignment-calendar-day:not(.has-assignments)")
      .first();
    await emptyDay.click();
    await expect(
      page.locator("div.assignment-panel", { hasText: name }),
    ).toHaveCount(0, {
      timeout: 10_000,
    });

    // Der Tag des Termins zeigt ihn wieder. Gezielt über den title (er listet
    // die Termine des Tages) statt über .first(): in CI liegt zusätzlich der
    // geseedete "Test-Termin" im Monat, und der kann an einem früheren Tag
    // stehen.
    const dayWithAssignment = grid.locator(
      `.assignment-calendar-day[title*="${name}"]`,
    );
    await dayWithAssignment.click();
    await expect(
      page.locator("div.assignment-panel", { hasText: name }),
    ).toBeVisible({
      timeout: 10_000,
    });
  });

  test("the chosen view mode survives a reload", async ({ page }) => {
    await login(page);
    const name = uniqueName("e2e-kalender-persist");
    const { groupId, yearMonth } = await createAssignment(page, name);
    await flowGoto(page, `/group/${groupId}/${yearMonth}/overview`);

    await page.locator("#view-calendar").locator("..").click();
    await expect(page.locator(".assignment-calendar-grid")).toBeVisible({
      timeout: 20_000,
    });

    await page.reload();
    await expect(page.locator(".assignment-calendar-grid")).toBeVisible({
      timeout: 20_000,
    });

    // Für die Folge-Tests wieder auf die Liste zurückstellen (localStorage).
    await page.locator("#view-list").locator("..").click();
    await expect(page.locator(".assignment-calendar-grid")).toHaveCount(0, {
      timeout: 10_000,
    });
  });
});

test.describe("Statistik", () => {
  test("renders the dashboard with both rates", async ({ page }) => {
    await login(page);
    await flowGoto(page, "/admin/statistik");
    await expect(page.locator("h1.page-header")).toContainText("Statistik", {
      timeout: 20_000,
    });
    await expect(page.locator("#page-wrapper")).toContainText(
      "Besetzungsgrad",
      {
        timeout: 20_000,
      },
    );
    await expect(page.locator("#page-wrapper")).toContainText(
      "Abschlussquote",
      {
        timeout: 20_000,
      },
    );
    await expect(page.locator("#page-wrapper")).toContainText("Alle Gruppen", {
      timeout: 20_000,
    });
  });

  test("is reachable from the admin submenu", async ({ page }) => {
    await login(page);
    await page.locator("#adminMenu > a").click();
    await page.locator("#toStatistics a").click();
    await expect(page).toHaveURL(/\/admin\/statistik$/);
  });
});

test.describe("CSV-Export", () => {
  test("downloads a semicolon separated file with both date columns", async ({
    page,
  }) => {
    await login(page);
    await flowGoto(page, "/admin/users");
    await expect(page.locator("#exportUsersCsv")).toBeVisible({
      timeout: 20_000,
    });

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 30_000 }),
      page.locator("#exportUsersCsv").click(),
    ]);

    expect(download.suggestedFilename()).toMatch(
      /^benutzer-\d{4}-\d{2}-\d{2}\.csv$/,
    );

    const csv = await readFile(await download.path(), "utf8");

    // BOM, damit deutsches Excel die Umlaute richtig liest.
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain(
      "Nachname;Vorname;E-Mail;Gruppen;Letzte Anmeldung;Letzte Aktivität",
    );
    expect(csv).toContain("admin@trolley.com");
  });
});

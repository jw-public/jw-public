import { test, expect } from "@playwright/test";
import {
  login,
  uniqueName,
  flowGoto,
  createAssignment,
  expandWeekUntilVisible,
  readStandardgruppeId,
  registerUserInGroup,
  clearMailbox,
  findMail,
} from "./helpers";

// Top-3-Features: persönliches iCal-Kalenderabo (Profil) und die
// Koordinator-Benachrichtigung, sobald ein Termin voll wird (ADR 0006). Die
// zeitgesteuerten Termin-Erinnerungen sind unit-getestet
// (AssignmentReminder.test.ts) — e2e wäre nur mit Zeitmanipulation sinnvoll.

test.describe("Kalender-Abo (iCal)", () => {
  test("profile provides a feed URL; applications show up; reset invalidates the old link", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const name = uniqueName("e2e-ical");

    await login(page);
    const { groupId, yearMonth } = await createAssignment(page, name);

    // Auf den Termin bewerben -> erscheint als Bewerbung (TENTATIVE) im Feed.
    await flowGoto(page, `/group/${groupId}/${yearMonth}/overview`);
    const panel = page.locator("div.assignment-panel", { hasText: name });
    await expandWeekUntilVisible(page, panel);
    await panel.getByText("Bewerben").click();
    await expect(panel.getByText("Bewerbung zurückziehen")).toBeVisible({
      timeout: 10_000,
    });

    // Kalender-Link im Profil erzeugen.
    await page.goto("/my-profile");
    await page.locator("button.show-calendar-url").click();
    const urlInput = page.locator("input#calendarFeedUrl");
    await expect(urlInput).toBeVisible({ timeout: 10_000 });
    const feedUrl = await urlInput.inputValue();
    expect(feedUrl).toMatch(/\/api\/calendar\/[a-f0-9]{40}\.ics$/);

    // Feed abrufen: gültiges ICS mit der Bewerbung als TENTATIVE-Event.
    const res = await page.request.get(feedUrl);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("text/calendar");
    const ics = await res.text();
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain(`Bewerbung: ${name}`);
    expect(ics).toContain("STATUS:TENTATIVE");

    // Link erneuern: neuer Token, alter Feed wird 404.
    await page.locator("button.reset-calendar-url").click();
    await page
      .locator(".app-modal", { hasText: "Kalender-Link erneuern" })
      .getByRole("button", { name: "Akzeptieren" })
      .click();
    await expect(urlInput).not.toHaveValue(feedUrl, { timeout: 10_000 });
    const newFeedUrl = await urlInput.inputValue();
    expect((await page.request.get(newFeedUrl)).status()).toBe(200);
    expect((await page.request.get(feedUrl)).status()).toBe(404);
  });
});

test.describe("Koordinator-Benachrichtigung bei vollem Termin", () => {
  test("the application that fills the assignment notifies the coordinator in-app and via email", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const name = uniqueName("e2e-fullnotify");
    const memberId = uniqueName("bewerberin");
    const memberEmail = `${memberId}@example.org`;
    const memberPassword = "test-passwort-123";

    // Termin in der Standardgruppe anlegen (admin ist deren Koordinator).
    // createAssignment setzt userGoal = 2, es braucht also zwei Bewerber.
    const stdGroupId = await readStandardgruppeId(page);
    await login(page);
    const { yearMonth } = await createAssignment(page, name);
    await page.goto("/logout");
    await expect(page.locator("input#login")).toBeVisible();

    // Neues Mitglied registrieren (pending) und vom Koordinator annehmen.
    await registerUserInGroup(
      page,
      stdGroupId,
      memberEmail,
      memberPassword,
      "Bianca",
      "Bewerberin",
    );
    await page.goto("/logout");
    await expect(page.locator("input#login")).toBeVisible();

    await login(page);
    await page.goto(`/group/${stdGroupId}/bewerber`);
    const applicantRow = page.locator("tr", { hasText: memberEmail });
    await expect(applicantRow).toBeVisible({ timeout: 15_000 });
    await applicantRow.locator("button.accept-user").click();
    await expect(page.locator("tr", { hasText: memberEmail })).toHaveCount(0, {
      timeout: 15_000,
    });

    // Erste Bewerbung durch den Koordinator selbst: 1 von 2 — noch nicht voll,
    // es darf also noch nichts passieren.
    await flowGoto(page, `/group/${stdGroupId}/${yearMonth}/overview`);
    const adminPanel = page.locator("div.assignment-panel", { hasText: name });
    await expandWeekUntilVisible(page, adminPanel);
    await adminPanel.getByText("Bewerben").click();
    await expect(adminPanel.getByText("Bewerbung zurückziehen")).toBeVisible({
      timeout: 10_000,
    });
    await page.goto("/logout");
    await expect(page.locator("input#login")).toBeVisible();

    // Zweite Bewerbung macht den Termin voll (2 von 2).
    await clearMailbox();
    await login(page, memberEmail, memberPassword);
    await flowGoto(page, `/group/${stdGroupId}/${yearMonth}/overview`);
    const panel = page.locator("div.assignment-panel", { hasText: name });
    await expandWeekUntilVisible(page, panel);
    await panel.getByText("Bewerben").click();
    await expect(panel.getByText("Bewerbung zurückziehen")).toBeVisible({
      timeout: 10_000,
    });
    await page.goto("/logout");
    await expect(page.locator("input#login")).toBeVisible();

    // Koordinator sieht die In-App-Benachrichtigung mit den zu bestätigenden
    // Personen ...
    await login(page);
    const dropdown = page.locator("#notificationsDropdown");
    await expect(dropdown.locator(".badge-notify")).toBeVisible({
      timeout: 15_000,
    });
    await dropdown.locator("a.dropdown-toggle").click();
    await expect(dropdown.locator(".dropdown-menu")).toContainText(
      "Termin ist voll",
      { timeout: 10_000 },
    );
    await expect(dropdown.locator(".dropdown-menu")).toContainText("Bianca", {
      timeout: 10_000,
    });
    // aufräumen, damit Folge-Tests keine Alt-Benachrichtigungen sehen
    await dropdown.locator("#removeAll").click();

    // ... und bekommt die E-Mail mit der Namensliste.
    const mail = await findMail(
      (m) =>
        m.Subject.includes(name) && /ist voll|is full|complet/i.test(m.Subject),
      20_000,
    );
    expect(mail.Snippet).toContain("Bianca");
  });
});

import { test, expect } from "@playwright/test";
import {
  login,
  uniqueName,
  readStandardgruppeId,
  registerUserInGroup,
} from "./helpers";

// Admin "Aufräumen" page: inactivity report plus deliberate deletion of
// dormant groups and users (data minimisation). The date thresholds are unit
// tested (tests/cleanup); here the wiring is exercised end-to-end via the
// "alles anzeigen" threshold, since freshly created fixtures are never older
// than 6 months.

const ID_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz";
function meteorId(prefix = ""): string {
  let id = prefix;
  while (id.length < 17)
    id += ID_ALPHABET[Math.floor(Math.random() * ID_ALPHABET.length)];
  return id.slice(0, 17);
}

test.describe("Cleanup (Aufräumen)", () => {
  test("dormant group shows up in the report and can be deleted", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const groupName = uniqueName("cleanup-grp");
    const groupId = meteorId("cupG");
    const assignmentId = meteorId("cupA");

    await login(page);

    // Group with a single assignment that lies 400 days in the past.
    await page.evaluate(
      async ({ groupId, groupName, assignmentId }) => {
        const M = (window as any).Meteor;
        const uid = M.userId();
        await M.callAsync("/groups/insertAsync", {
          _id: groupId,
          name: groupName,
          additional: "cleanup e2e",
          coordinators: [uid],
          creator: uid,
        });
        const start = new Date(Date.now() - 400 * 24 * 3600 * 1000);
        const end = new Date(start.getTime() + 2 * 3600 * 1000);
        await M.callAsync("/assignments/insertAsync", {
          _id: assignmentId,
          name: "Alt-Termin",
          group: groupId,
          start,
          end,
          contacts: [uid],
        });
      },
      { groupId, groupName, assignmentId },
    );

    await page.goto("/admin/cleanup");
    await expect(page.locator("h1.page-header")).toContainText("Aufräumen", {
      timeout: 20_000,
    });

    // The fresh fixture is not 12 months old; list everything instead.
    await page.locator("#cleanupThreshold").selectOption("0");
    // Wait until the 0-day report replaced the initial 12-month one — panels
    // keep showing the previous report while the new request is in flight.
    await expect(page.getByText("Analysiere…")).toBeHidden({ timeout: 20_000 });
    const groupsPanel = page.locator("#inactiveGroupsPanel");
    await expect(groupsPanel).toBeVisible({ timeout: 20_000 });
    await groupsPanel.locator("input[type='search']").fill(groupName);
    const row = groupsPanel.locator("tbody tr", { hasText: groupName });
    await expect(row).toBeVisible({ timeout: 15_000 });

    await row.locator("button.delete-group").click();
    const modal = page.locator(".app-modal", { hasText: "Gruppe löschen" });
    await expect(modal).toContainText("1 Terminen");
    await modal.getByRole("button", { name: "Akzeptieren" }).click();

    await expect(
      groupsPanel.locator("tbody tr", { hasText: groupName }),
    ).toHaveCount(0, {
      timeout: 15_000,
    });
    const exists = await page.evaluate(
      (gid) => (window as any).Meteor.callAsync("groupExists", gid),
      groupId,
    );
    expect(exists).toBe(false);
  });

  test("user can be deleted from the report", async ({ page }) => {
    test.setTimeout(120_000);
    const id = uniqueName("cleanupu");
    const email = `${id}@example.org`;
    const password = "test-passwort-123";

    const stdGroup = await readStandardgruppeId(page);
    await registerUserInGroup(
      page,
      stdGroup,
      email,
      password,
      "Klaus",
      "Karteileiche",
    );
    await page.goto("/logout");
    await expect(page.locator("input#login")).toBeVisible();

    await login(page);
    await page.goto("/admin/cleanup");
    await page.locator("#cleanupThreshold").selectOption("0");
    // Wait until the 0-day report replaced the initial 12-month one — panels
    // keep showing the previous report while the new request is in flight.
    await expect(page.getByText("Analysiere…")).toBeHidden({ timeout: 20_000 });
    const usersPanel = page.locator("#inactiveUsersPanel");
    await expect(usersPanel).toBeVisible({ timeout: 20_000 });
    await usersPanel.locator("input[type='search']").fill(email);
    const row = usersPanel.locator("tbody tr", { hasText: email });
    await expect(row).toBeVisible({ timeout: 15_000 });

    await row.locator("button.delete-user").click();
    const modal = page.locator(".app-modal", { hasText: "Benutzer löschen" });
    await modal.getByRole("button", { name: "Akzeptieren" }).click();

    await expect(
      usersPanel.locator("tbody tr", { hasText: email }),
    ).toHaveCount(0, {
      timeout: 15_000,
    });
    const exists = await page.evaluate(
      (em) => (window as any).Meteor.callAsync("userExists", em),
      email,
    );
    expect(exists).toBe(false);
  });

  test("deleting a group strands its applicants; bulk delete removes them", async ({ page }) => {
    test.setTimeout(120_000);
    const groupName = uniqueName("cleanup-orphan");
    const groupId = meteorId("cupo");
    const id = uniqueName("orphan");
    const email = `${id}@example.org`;

    // Group, then a user whose ONLY tie to the app is the application to it.
    await login(page);
    await page.evaluate(
      async ({ groupId, groupName }) => {
        const M = (window as any).Meteor;
        const uid = M.userId();
        await M.callAsync("/groups/insertAsync", {
          _id: groupId,
          name: groupName,
          additional: "cleanup orphan e2e",
          coordinators: [uid],
          creator: uid,
        });
      },
      { groupId, groupName },
    );
    await page.goto("/logout");
    await expect(page.locator("input#login")).toBeVisible();
    await registerUserInGroup(page, groupId, email, "test-passwort-123", "Otto", "Ohnegruppe");
    await page.goto("/logout");
    await expect(page.locator("input#login")).toBeVisible();

    // Deleting the group pulls the pending application -> user is groupless.
    await login(page);
    await page.evaluate(
      (gid) => (window as any).Meteor.callAsync("adminDeleteGroup", gid),
      groupId,
    );

    // Groupless users are listed regardless of the threshold (default 12 months).
    await page.goto("/admin/cleanup");
    const usersPanel = page.locator("#inactiveUsersPanel");
    await expect(usersPanel).toBeVisible({ timeout: 20_000 });
    await usersPanel.locator("input[type='search']").fill(email);
    const row = usersPanel.locator("tbody tr", { hasText: email });
    await expect(row).toBeVisible({ timeout: 15_000 });
    await expect(row).toContainText("ohne Gruppe");

    await usersPanel.locator("button.delete-all-groupless").click();
    const modal = page.locator(".app-modal", { hasText: "Benutzer ohne Gruppe löschen" });
    await modal.getByRole("button", { name: "Akzeptieren" }).click();

    await expect(usersPanel.locator("tbody tr", { hasText: email })).toHaveCount(0, {
      timeout: 15_000,
    });
    const exists = await page.evaluate(
      (em) => (window as any).Meteor.callAsync("userExists", em),
      email,
    );
    expect(exists).toBe(false);
  });

  test("admins are listed without a delete button", async ({ page }) => {
    test.setTimeout(120_000);
    // A fresh second admin is deterministic: unlike the seed admin it never
    // has upcoming assignments (a future assignment counts as activity and
    // keeps a user out of even the 0-day report).
    const id = uniqueName("cleanupadm");
    const email = `${id}@example.org`;

    const stdGroup = await readStandardgruppeId(page);
    await registerUserInGroup(page, stdGroup, email, "test-passwort-123", "Anna", "Admin");
    const newUid = await page.evaluate(() => (window as any).Meteor.userId() as string);
    await page.goto("/logout");
    await expect(page.locator("input#login")).toBeVisible();

    await login(page);
    await page.evaluate(
      (uid) => (window as any).Meteor.callAsync("adminSetUserRoles", uid, ["admin"]),
      newUid,
    );

    try {
      await page.goto("/admin/cleanup");
      await page.locator("#cleanupThreshold").selectOption("0");
      // Wait until the 0-day report replaced the initial 12-month one — panels
      // keep showing the previous report while the new request is in flight.
      await expect(page.getByText("Analysiere…")).toBeHidden({ timeout: 20_000 });
      const usersPanel = page.locator("#inactiveUsersPanel");
      await expect(usersPanel).toBeVisible({ timeout: 20_000 });
      await usersPanel.locator("input[type='search']").fill(email);
      const row = usersPanel.locator("tbody tr", { hasText: email });
      await expect(row).toBeVisible({ timeout: 15_000 });
      await expect(row.locator("button.delete-user")).toHaveCount(0);
      await expect(row).toContainText("Admin");
    } finally {
      // demote again, then remove the fixture account
      await page.evaluate(
        (uid) => (window as any).Meteor.callAsync("adminSetUserRoles", uid, []),
        newUid,
      );
      await page.evaluate(
        (uid) => (window as any).Meteor.callAsync("removeUser", uid),
        newUid,
      );
    }
  });
});

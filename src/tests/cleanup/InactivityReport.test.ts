import { assert } from "chai";
import { computeInactivityReport } from "../../imports/cleanup/InactivityReport";

const NOW = new Date("2026-07-01T12:00:00Z");
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 24 * 60 * 60 * 1000);

describe("computeInactivityReport", function () {
  it("flags groups whose latest assignment is older than the threshold", function () {
    const report = computeInactivityReport({
      users: [],
      adminIds: [],
      groups: [
        { _id: "old", name: "Alt", createdAt: daysAgo(2000) },
        { _id: "fresh", name: "Frisch", createdAt: daysAgo(2000) },
      ],
      assignments: [
        { group: "old", start: daysAgo(400) },
        { group: "old", start: daysAgo(500) },
        { group: "fresh", start: daysAgo(10) },
      ],
      thresholdDays: 365,
      now: NOW,
    });

    assert.deepEqual(
      report.groups.map((g) => g._id),
      ["old"],
    );
    assert.equal(report.groups[0].assignmentCount, 2);
    assert.equal(report.groups[0].lastActivity!.getTime(), daysAgo(400).getTime());
  });

  it("a future assignment keeps a group active", function () {
    const report = computeInactivityReport({
      users: [],
      adminIds: [],
      groups: [{ _id: "g", name: "G", createdAt: daysAgo(2000) }],
      assignments: [
        { group: "g", start: daysAgo(700) },
        { group: "g", start: daysAgo(-14) }, // in two weeks
      ],
      thresholdDays: 365,
      now: NOW,
    });
    assert.lengthOf(report.groups, 0);
  });

  it("groups without any assignment fall back to their creation date", function () {
    const report = computeInactivityReport({
      users: [],
      adminIds: [],
      groups: [
        { _id: "oldEmpty", name: "Alt leer", createdAt: daysAgo(800) },
        { _id: "newEmpty", name: "Neu leer", createdAt: daysAgo(3) },
      ],
      assignments: [],
      thresholdDays: 365,
      now: NOW,
    });
    assert.deepEqual(
      report.groups.map((g) => g._id),
      ["oldEmpty"],
    );
  });

  it("counts members per group", function () {
    const report = computeInactivityReport({
      users: [
        { _id: "u1", groups: ["g"], createdAt: daysAgo(1) },
        { _id: "u2", groups: ["g"], createdAt: daysAgo(1) },
      ],
      adminIds: [],
      groups: [{ _id: "g", name: "G", createdAt: daysAgo(800) }],
      assignments: [],
      thresholdDays: 365,
      now: NOW,
    });
    assert.equal(report.groups[0].memberCount, 2);
  });

  it("takes the newest signal of login token, profile update, participation and creation", function () {
    const base = {
      adminIds: [],
      groups: [{ _id: "g", name: "G", createdAt: daysAgo(1) }],
      thresholdDays: 365,
      now: NOW,
    };

    // recent login token wins although everything else is ancient
    let report = computeInactivityReport({
      ...base,
      assignments: [],
      users: [
        {
          _id: "u",
          createdAt: daysAgo(2000),
          updatedAt: daysAgo(900),
          services: { resume: { loginTokens: [{ when: daysAgo(30) }] } },
        },
      ],
    });
    assert.lengthOf(report.users, 0, "recent login must keep the user active");

    // recent assignment participation wins
    report = computeInactivityReport({
      ...base,
      assignments: [{ group: "g", start: daysAgo(20), participants: [{ user: "u" }] }],
      users: [{ _id: "u", createdAt: daysAgo(2000) }],
    });
    assert.lengthOf(report.users, 0, "recent participation must keep the user active");

    // everything old -> inactive, lastActivity = newest of the old signals
    report = computeInactivityReport({
      ...base,
      assignments: [{ group: "g", start: daysAgo(600), applicants: [{ user: "u" }] }],
      users: [{ _id: "u", createdAt: daysAgo(2000), updatedAt: daysAgo(800) }],
    });
    assert.lengthOf(report.users, 1);
    assert.equal(report.users[0].lastActivity!.getTime(), daysAgo(600).getTime());
    assert.isNull(report.users[0].lastLogin);
  });

  it("marks admins and resolves group names, sorted oldest first", function () {
    const report = computeInactivityReport({
      users: [
        {
          _id: "a",
          createdAt: daysAgo(500),
          profile: { first_name: "Alte", last_name: "Adminin" },
          emails: [{ address: "a@x.de" }],
          groups: ["g"],
        },
        { _id: "b", createdAt: daysAgo(900), profile: { first_name: "Uralt" }, groups: [] },
      ],
      adminIds: ["a"],
      groups: [{ _id: "g", name: "Gruppe X", createdAt: daysAgo(1) }],
      assignments: [],
      thresholdDays: 365,
      now: NOW,
    });

    assert.deepEqual(
      report.users.map((u) => u._id),
      ["b", "a"],
    );
    const admin = report.users.find((u) => u._id === "a")!;
    assert.isTrue(admin.isAdmin);
    assert.equal(admin.name, "Alte Adminin");
    assert.equal(admin.email, "a@x.de");
    assert.deepEqual(admin.groupNames, ["Gruppe X"]);
  });

  it("threshold 0 lists everything not active this instant", function () {
    const report = computeInactivityReport({
      users: [{ _id: "u", createdAt: daysAgo(1) }],
      adminIds: [],
      groups: [{ _id: "g", name: "G", createdAt: daysAgo(1) }],
      assignments: [],
      thresholdDays: 0,
      now: NOW,
    });
    assert.lengthOf(report.users, 1);
    assert.lengthOf(report.groups, 1);
  });
});

import { assert } from "chai";

import {
  buildUsageReport,
  recentMonths,
  UsageAssignmentInput,
} from "../../imports/statistics/UsageReport";

const GROUPS = [
  { _id: "g1", name: "Innenstadt" },
  { _id: "g2", name: "Bahnhof" },
];

function assignment(overrides: Partial<UsageAssignmentInput> = {}): UsageAssignmentInput {
  return {
    group: "g1",
    start: new Date(2026, 6, 15),
    state: "Online",
    userGoal: 2,
    participants: [],
    applicants: [],
    ...overrides,
  };
}

describe("UsageReport", function () {
  describe("recentMonths", function () {
    it("returns the requested number of months, oldest first", function () {
      const months = recentMonths(3, new Date(2026, 7, 28));
      assert.deepEqual(months, ["2026-06", "2026-07", "2026-08"]);
    });

    it("crosses the year boundary", function () {
      const months = recentMonths(3, new Date(2026, 0, 15));
      assert.deepEqual(months, ["2025-11", "2025-12", "2026-01"]);
    });
  });

  it("counts assignments per state", function () {
    const report = buildUsageReport({
      months: ["2026-07"],
      groups: GROUPS,
      assignments: [
        assignment({ state: "Online" }),
        assignment({ state: "Closed", participants: [{ user: "a" }, { user: "b" }] }),
        assignment({ state: "Canceled" }),
      ],
    });

    const bucket = report.groups[0].buckets[0];
    assert.equal(bucket.assignments, 3);
    assert.equal(bucket.open, 1);
    assert.equal(bucket.closed, 1);
    assert.equal(bucket.canceled, 1);
  });

  it("computes the occupancy rate from participants against the user goal", function () {
    const report = buildUsageReport({
      months: ["2026-07"],
      groups: GROUPS,
      assignments: [
        assignment({ state: "Closed", userGoal: 4, participants: [{ user: "a" }, { user: "b" }] }),
        assignment({ state: "Closed", userGoal: 4, participants: [{ user: "c" }] }),
      ],
    });

    // 3 Teilnehmer auf 8 Plätze.
    assert.equal(report.groups[0].buckets[0].occupancyRate, 3 / 8);
    assert.equal(report.groups[0].buckets[0].participations, 3);
  });

  it("reports an undefined occupancy rate when no assignment has a user goal", function () {
    const report = buildUsageReport({
      months: ["2026-07"],
      groups: GROUPS,
      assignments: [assignment({ userGoal: undefined })],
    });

    // Nicht 0 % — die Quote ist schlicht nicht definiert.
    assert.isNull(report.groups[0].buckets[0].occupancyRate);
  });

  it("computes the closing rate over non-canceled assignments only", function () {
    const report = buildUsageReport({
      months: ["2026-07"],
      groups: GROUPS,
      assignments: [
        assignment({ state: "Closed" }),
        assignment({ state: "Online" }),
        assignment({ state: "Canceled" }),
      ],
    });

    // 1 geschlossen von 2 nicht abgesagten — der abgesagte zählt nicht mit.
    assert.equal(report.groups[0].buckets[0].closingRate, 0.5);
  });

  it("keeps canceled assignments out of the occupancy figures", function () {
    const report = buildUsageReport({
      months: ["2026-07"],
      groups: GROUPS,
      assignments: [
        assignment({ state: "Closed", userGoal: 2, participants: [{ user: "a" }, { user: "b" }] }),
        assignment({ state: "Canceled", userGoal: 10 }),
      ],
    });

    assert.equal(report.groups[0].buckets[0].userGoalSum, 2);
    assert.equal(report.groups[0].buckets[0].occupancyRate, 1);
  });

  it("keeps groups apart and sums them into the overall figures", function () {
    const report = buildUsageReport({
      months: ["2026-07"],
      groups: GROUPS,
      assignments: [
        assignment({ group: "g1", state: "Closed", userGoal: 2, participants: [{ user: "a" }] }),
        assignment({ group: "g2", state: "Closed", userGoal: 2, participants: [{ user: "b" }] }),
      ],
    });

    assert.equal(report.groups[0].buckets[0].assignments, 1);
    assert.equal(report.groups[1].buckets[0].assignments, 1);
    assert.equal(report.overall[0].assignments, 2);
    assert.equal(report.overall[0].occupancyRate, 2 / 4);
  });

  it("yields empty buckets for months without assignments", function () {
    const report = buildUsageReport({
      months: ["2026-06", "2026-07"],
      groups: GROUPS,
      assignments: [assignment({ start: new Date(2026, 6, 3) })],
    });

    assert.equal(report.groups[0].buckets[0].assignments, 0);
    assert.isNull(report.groups[0].buckets[0].occupancyRate);
    assert.equal(report.groups[0].buckets[1].assignments, 1);
  });

  it("ignores assignments outside the reported months", function () {
    const report = buildUsageReport({
      months: ["2026-07"],
      groups: GROUPS,
      assignments: [assignment({ start: new Date(2025, 0, 5) })],
    });

    assert.equal(report.overallTotal.assignments, 0);
  });

  it("ignores assignments of groups that no longer exist", function () {
    const report = buildUsageReport({
      months: ["2026-07"],
      groups: GROUPS,
      assignments: [assignment({ group: "geloescht" })],
    });

    assert.equal(report.overallTotal.assignments, 0);
  });
});

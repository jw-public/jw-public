// Pure computation behind the admin "Aufräumen" page: which groups and users
// have been inactive for longer than a threshold. Deliberately free of Meteor
// imports so the date logic is unit-testable without a Meteor runtime; the
// server method (server/methods.ts adminInactivityReport) feeds it lean
// projections of the real collections.

export interface InactivityUserInput {
  _id: string;
  createdAt?: Date;
  updatedAt?: Date;
  profile?: { first_name?: string; last_name?: string };
  emails?: Array<{ address: string }>;
  groups?: string[];
  services?: { resume?: { loginTokens?: Array<{ when?: Date }> } };
}

export interface InactivityGroupInput {
  _id: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface InactivityAssignmentInput {
  group: string;
  start: Date;
  participants?: Array<{ user: string; when?: Date }>;
  applicants?: Array<{ user: string; when?: Date }>;
}

export interface InactiveGroupEntry {
  _id: string;
  name: string;
  memberCount: number;
  assignmentCount: number;
  /** Latest assignment start in the group (or group created/updated as fallback). */
  lastActivity: Date | null;
}

export interface InactiveUserEntry {
  _id: string;
  name: string;
  email: string;
  groupNames: string[];
  /** Most recent login-token timestamp; null if none survive (tokens expire). */
  lastLogin: Date | null;
  /** max(lastLogin, profile update, assignment participation/application, createdAt). */
  lastActivity: Date | null;
  /** Admins are listed but must not be deletable (removeUser refuses anyway). */
  isAdmin: boolean;
}

export interface InactivityReport {
  thresholdDays: number;
  cutoff: Date;
  groups: InactiveGroupEntry[];
  users: InactiveUserEntry[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

function maxDate(...candidates: Array<Date | null | undefined>): Date | null {
  let max: Date | null = null;
  for (const c of candidates) {
    if (c instanceof Date && !isNaN(c.getTime()) && (max === null || c > max)) {
      max = c;
    }
  }
  return max;
}

export function computeInactivityReport(input: {
  users: InactivityUserInput[];
  groups: InactivityGroupInput[];
  assignments: InactivityAssignmentInput[];
  adminIds: string[];
  thresholdDays: number;
  now: Date;
}): InactivityReport {
  const { users, groups, assignments, thresholdDays, now } = input;
  const cutoff = new Date(now.getTime() - thresholdDays * DAY_MS);
  const adminIds = new Set(input.adminIds);

  // --- one pass over the assignments collects both perspectives -------------
  const groupLastAssignment = new Map<string, Date>();
  const groupAssignmentCount = new Map<string, number>();
  const userLastAssignment = new Map<string, Date>();

  for (const a of assignments) {
    groupAssignmentCount.set(a.group, (groupAssignmentCount.get(a.group) ?? 0) + 1);
    const prev = groupLastAssignment.get(a.group);
    if (a.start instanceof Date && (!prev || a.start > prev)) {
      groupLastAssignment.set(a.group, a.start);
    }
    for (const entry of [...(a.participants ?? []), ...(a.applicants ?? [])]) {
      const candidate = maxDate(a.start, entry.when);
      const prevUser = userLastAssignment.get(entry.user);
      if (candidate && (!prevUser || candidate > prevUser)) {
        userLastAssignment.set(entry.user, candidate);
      }
    }
  }

  const memberCount = new Map<string, number>();
  for (const u of users) {
    for (const g of u.groups ?? []) {
      memberCount.set(g, (memberCount.get(g) ?? 0) + 1);
    }
  }

  const groupNameById = new Map(groups.map((g) => [g._id, g.name] as const));

  // --- inactive groups -------------------------------------------------------
  const inactiveGroups: InactiveGroupEntry[] = [];
  for (const g of groups) {
    const lastActivity = maxDate(groupLastAssignment.get(g._id), g.updatedAt, g.createdAt);
    if (lastActivity === null || lastActivity < cutoff) {
      inactiveGroups.push({
        _id: g._id,
        name: g.name,
        memberCount: memberCount.get(g._id) ?? 0,
        assignmentCount: groupAssignmentCount.get(g._id) ?? 0,
        lastActivity,
      });
    }
  }

  // --- inactive users --------------------------------------------------------
  const inactiveUsers: InactiveUserEntry[] = [];
  for (const u of users) {
    const lastLogin = maxDate(...(u.services?.resume?.loginTokens ?? []).map((t) => t.when));
    const lastActivity = maxDate(
      lastLogin,
      u.updatedAt,
      userLastAssignment.get(u._id),
      u.createdAt,
    );
    if (lastActivity === null || lastActivity < cutoff) {
      const first = u.profile?.first_name ?? "";
      const last = u.profile?.last_name ?? "";
      inactiveUsers.push({
        _id: u._id,
        name: `${first} ${last}`.trim() || u._id,
        email: u.emails?.[0]?.address ?? "",
        groupNames: (u.groups ?? []).map((g) => groupNameById.get(g) ?? g),
        lastLogin,
        lastActivity,
        isAdmin: adminIds.has(u._id),
      });
    }
  }

  const oldestFirst = (a: { lastActivity: Date | null }, b: { lastActivity: Date | null }) =>
    (a.lastActivity?.getTime() ?? 0) - (b.lastActivity?.getTime() ?? 0);
  inactiveGroups.sort(oldestFirst);
  inactiveUsers.sort(oldestFirst);

  return { thresholdDays, cutoff, groups: inactiveGroups, users: inactiveUsers };
}

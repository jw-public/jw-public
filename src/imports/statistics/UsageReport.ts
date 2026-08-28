// Reine Berechnung hinter dem Admin-Dashboard "Statistik": Besetzungsgrad,
// Abschlussquote und Teilnahmen je Gruppe und Monat. Bewusst frei von
// Meteor-Importen, damit die Kennzahlen ohne Meteor-Laufzeit testbar sind; die
// Server-Methode (server/methods.ts adminUsageReport) füttert sie mit schlanken
// Projektionen der echten Collections — dasselbe Muster wie InactivityReport.

export interface UsageAssignmentInput {
  group: string;
  start: Date;
  state?: string;
  userGoal?: number;
  participants?: Array<{ user: string }>;
  applicants?: Array<{ user: string }>;
}

export interface UsageGroupInput {
  _id: string;
  name: string;
}

/** Kennzahlen eines Monats — für eine Gruppe oder über alle Gruppen. */
export interface UsageBucket {
  /** Monat als "YYYY-MM". */
  month: string;
  assignments: number;
  open: number;
  closed: number;
  canceled: number;
  /** Summe der Sollzahlen; Termine ohne Sollzahl zählen mit 0. */
  userGoalSum: number;
  /** Summe der bestätigten Teilnehmer. */
  participantSum: number;
  /** Einzelne Teilnahmen — dieselbe Zahl wie participantSum, als Klartext. */
  participations: number;
  /**
   * Besetzungsgrad: Teilnehmer geteilt durch Sollzahl, 0..1. `null`, wenn im
   * Monat kein Termin eine Sollzahl hatte — dann ist die Quote nicht definiert
   * und darf nicht als 0 % gezeigt werden.
   */
  occupancyRate: number | null;
  /**
   * Abschlussquote: geschlossene geteilt durch alle nicht abgesagten Termine.
   * `null`, wenn es im Monat keinen solchen Termin gab.
   */
  closingRate: number | null;
}

export interface UsageGroupReport {
  groupId: string;
  groupName: string;
  buckets: UsageBucket[];
  total: UsageBucket;
}

export interface UsageReport {
  /** Die abgedeckten Monate, aufsteigend, als "YYYY-MM". */
  months: string[];
  groups: UsageGroupReport[];
  /** Dieselben Kennzahlen über alle Gruppen hinweg. */
  overall: UsageBucket[];
  overallTotal: UsageBucket;
}

const STATE_CLOSED = "Closed";
const STATE_CANCELED = "Canceled";

function monthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/** Die letzten `count` Monate, aufsteigend, der aktuelle zuletzt. */
export function recentMonths(count: number, now: Date = new Date()): string[] {
  const months: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    months.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  }
  return months;
}

function emptyBucket(month: string): UsageBucket {
  return {
    month,
    assignments: 0,
    open: 0,
    closed: 0,
    canceled: 0,
    userGoalSum: 0,
    participantSum: 0,
    participations: 0,
    occupancyRate: null,
    closingRate: null,
  };
}

function addAssignment(bucket: UsageBucket, assignment: UsageAssignmentInput): void {
  bucket.assignments += 1;

  if (assignment.state === STATE_CANCELED) {
    bucket.canceled += 1;
  } else if (assignment.state === STATE_CLOSED) {
    bucket.closed += 1;
  } else {
    bucket.open += 1;
  }

  // Abgesagte Termine bleiben aus beiden Quoten heraus: sie haben weder eine
  // Besetzung zu erreichen noch einen Abschluss zu erwarten.
  if (assignment.state === STATE_CANCELED) {
    return;
  }

  const participants = assignment.participants?.length ?? 0;
  bucket.userGoalSum += assignment.userGoal ?? 0;
  bucket.participantSum += participants;
  bucket.participations += participants;
}

function finalize(bucket: UsageBucket): UsageBucket {
  const rateBase = bucket.closed + bucket.open;

  return {
    ...bucket,
    occupancyRate: bucket.userGoalSum > 0 ? bucket.participantSum / bucket.userGoalSum : null,
    closingRate: rateBase > 0 ? bucket.closed / rateBase : null,
  };
}

function sumBuckets(month: string, buckets: UsageBucket[]): UsageBucket {
  const total = emptyBucket(month);

  buckets.forEach((b) => {
    total.assignments += b.assignments;
    total.open += b.open;
    total.closed += b.closed;
    total.canceled += b.canceled;
    total.userGoalSum += b.userGoalSum;
    total.participantSum += b.participantSum;
    total.participations += b.participations;
  });

  return finalize(total);
}

/**
 * Verdichtet Termine zu Monatskennzahlen je Gruppe.
 *
 * "Auslastung" wird bewusst in zwei Kennzahlen getrennt: der **Besetzungsgrad**
 * beantwortet, ob genug Verkündiger zusammenkommen; die **Abschlussquote**
 * beantwortet, ob die Koordinatoren ihre Termine abarbeiten. Ein Monat kann
 * lauter geschlossene Termine haben und trotzdem halb leer sein.
 */
export function buildUsageReport(options: {
  months: string[];
  groups: UsageGroupInput[];
  assignments: UsageAssignmentInput[];
}): UsageReport {
  const monthSet = new Set(options.months);

  const byGroup = new Map<string, Map<string, UsageBucket>>();
  options.groups.forEach((group) => {
    const buckets = new Map<string, UsageBucket>();
    options.months.forEach((month) => buckets.set(month, emptyBucket(month)));
    byGroup.set(group._id, buckets);
  });

  options.assignments.forEach((assignment) => {
    const month = monthKey(assignment.start);
    if (!monthSet.has(month)) {
      return;
    }
    const bucket = byGroup.get(assignment.group)?.get(month);
    if (bucket) {
      addAssignment(bucket, assignment);
    }
  });

  const groups: UsageGroupReport[] = options.groups.map((group) => {
    const buckets = options.months.map((month) => finalize(byGroup.get(group._id)!.get(month)!));
    return {
      groupId: group._id,
      groupName: group.name,
      buckets,
      total: sumBuckets("total", buckets),
    };
  });

  const overall = options.months.map((month, index) =>
    sumBuckets(
      month,
      groups.map((g) => g.buckets[index]),
    ),
  );

  return {
    months: options.months,
    groups,
    overall,
    overallTotal: sumBuckets("total", overall),
  };
}

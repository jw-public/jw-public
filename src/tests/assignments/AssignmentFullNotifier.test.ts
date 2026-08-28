import { assert } from "chai";

import { AssignmentDAO } from "../../collections/lib/AssignmentsCollection";
import { AssignmentCopyActionDAO } from "../../collections/lib/AssignmentCopyActionsCollection";
import { GroupDAO } from "../../collections/lib/GroupCollection";
import { NotificationDAO } from "../../collections/lib/classes/UserNotification";
import { UserDAO } from "../../collections/lib/UserCollection";
import { SimpleCollection } from "../../imports/interfaces/SimpleCollection";
import { IUserMailer, IUserMailerOptions } from "../../server/mailing/interfaces/IUserMailer";
import { IAssignmentFullNotifier } from "../../server/assignments/classes/AssignmentFullNotifier";
import { buildServices } from "../../server/services";
import { LocalCollection } from "../3rdParty/minimongo-standalone/minimongo-standalone";
import { NullEmailSender } from "../common/NullEmailSender";

const NOW = new Date("2026-07-09T10:00:00Z");
const daysFromNow = (d: number) => new Date(NOW.getTime() + d * 24 * 60 * 60 * 1000);

class RecordingUserMailer implements IUserMailer {
  public sent: IUserMailerOptions[] = [];
  public async send(options: IUserMailerOptions): Promise<void> {
    this.sent.push(options);
  }
}

class TestBed {
  public users = new LocalCollection<UserDAO>("users");
  public groups = new LocalCollection<GroupDAO>("groups");
  public assignments = new LocalCollection<AssignmentDAO>("assignments");
  public notifications = new LocalCollection<NotificationDAO>("notifications");
  public mailer = new RecordingUserMailer();
  public notifier: IAssignmentFullNotifier;

  constructor() {
    const services = buildServices(
      {
        assignments: this.assignments,
        assignmentCopyActions: new LocalCollection<AssignmentCopyActionDAO>("copyActions"),
        notifications: this.notifications,
        users: this.users as unknown as SimpleCollection<UserDAO>,
        groups: this.groups,
      },
      new NullEmailSender(),
      { userMailer: this.mailer },
    );
    this.notifier = services.assignmentFullNotifier;
  }

  addUser(id: string, profile: object): string {
    return this.users.insert({
      _id: id,
      profile: { first_name: id, last_name: "Test", language: "de-de", ...profile },
    } as any);
  }

  addGroupWithAssignment(options: {
    coordinators: string[];
    start: Date;
    userGoal?: number;
    applicants?: string[];
    participants?: string[];
    state?: string;
    groupEmail?: string;
  }): string {
    const groupId = this.groups.insert({
      name: "Testgruppe",
      coordinators: options.coordinators,
      email: options.groupEmail,
    } as any);
    return this.assignments.insert({
      name: "Bahnhof",
      group: groupId,
      start: options.start,
      end: new Date(options.start.getTime() + 2 * 60 * 60 * 1000),
      state: options.state ?? "Online",
      userGoal: options.userGoal ?? 2,
      applicants: (options.applicants ?? []).map((user) => ({ user })),
      participants: (options.participants ?? []).map((user) => ({ user })),
    } as any);
  }

  notificationsFor(userId: string): NotificationDAO[] {
    return this.notifications.find({ userId }).fetch();
  }
}

describe("AssignmentFullNotifier", function () {
  it("notifies in-app and via email when the assignment just became full", async function () {
    const bed = new TestBed();
    bed.addUser("koordinator", { notificationAsEmail: true });
    bed.addUser("anna", {});
    bed.addUser("bernd", {});
    const assignmentId = bed.addGroupWithAssignment({
      coordinators: ["koordinator"],
      start: daysFromNow(2),
      userGoal: 2,
      applicants: ["anna", "bernd"],
      groupEmail: "gruppe@jw-public.org",
    });

    await bed.notifier.notifyCoordinatorsIfAssignmentBecameFull(assignmentId, 1, NOW);

    const inApp = bed.notificationsFor("koordinator");
    assert.lengthOf(inApp, 1);
    assert.equal(inApp[0].simpleData!.title, "Termin ist voll");
    assert.include(inApp[0].simpleData!.details, "anna Test");
    assert.include(inApp[0].simpleData!.details, "bernd Test");
    assert.equal(inApp[0].simpleData!.link, `/einsatz/${assignmentId}`);

    assert.lengthOf(bed.mailer.sent, 1);
    assert.equal(bed.mailer.sent[0].recepientId, "koordinator");
    assert.include(bed.mailer.sent[0].subject, "ist voll");
    assert.include(bed.mailer.sent[0].subject, "Bahnhof");
    assert.equal(bed.mailer.sent[0].replyToAddress, "gruppe@jw-public.org");
  });

  it("lists the applicants to confirm as a numbered list in the email", async function () {
    const bed = new TestBed();
    bed.addUser("koordinator", { notificationAsEmail: true });
    bed.addUser("anna", {});
    bed.addUser("bernd", {});
    const assignmentId = bed.addGroupWithAssignment({
      coordinators: ["koordinator"],
      start: daysFromNow(2),
      userGoal: 2,
      applicants: ["anna", "bernd"],
    });

    await bed.notifier.notifyCoordinatorsIfAssignmentBecameFull(assignmentId, 1, NOW);

    const body = bed.mailer.sent[0].markdownContent;
    assert.include(body, "Zu bestätigen");
    assert.include(body, "1. anna Test");
    assert.include(body, "2. bernd Test");
    // Kontaktdaten gehören bewusst nicht in die Mail (ADR 0006).
    assert.notInclude(body, "@example");
  });

  it("stays silent while the assignment is not full yet", async function () {
    const bed = new TestBed();
    bed.addUser("koordinator", { notificationAsEmail: true });
    bed.addUser("anna", {});
    const assignmentId = bed.addGroupWithAssignment({
      coordinators: ["koordinator"],
      start: daysFromNow(2),
      userGoal: 3,
      applicants: ["anna"],
    });

    await bed.notifier.notifyCoordinatorsIfAssignmentBecameFull(assignmentId, 0, NOW);

    assert.lengthOf(bed.notificationsFor("koordinator"), 0);
    assert.lengthOf(bed.mailer.sent, 0);
  });

  it("stays silent when the assignment was already full before", async function () {
    const bed = new TestBed();
    bed.addUser("koordinator", { notificationAsEmail: true });
    bed.addUser("anna", {});
    bed.addUser("bernd", {});
    bed.addUser("clara", {});
    const assignmentId = bed.addGroupWithAssignment({
      coordinators: ["koordinator"],
      start: daysFromNow(2),
      userGoal: 2,
      applicants: ["anna", "bernd", "clara"],
    });

    // Der dritte Bewerber auf einen bereits vollen Termin ist kein Übergang.
    await bed.notifier.notifyCoordinatorsIfAssignmentBecameFull(assignmentId, 2, NOW);

    assert.lengthOf(bed.notificationsFor("koordinator"), 0);
    assert.lengthOf(bed.mailer.sent, 0);
  });

  it("notifies again after the assignment dropped below the goal and filled up once more", async function () {
    const bed = new TestBed();
    bed.addUser("koordinator", { notificationAsEmail: true });
    bed.addUser("anna", {});
    bed.addUser("bernd", {});
    const assignmentId = bed.addGroupWithAssignment({
      coordinators: ["koordinator"],
      start: daysFromNow(2),
      userGoal: 2,
      applicants: ["anna", "bernd"],
    });

    await bed.notifier.notifyCoordinatorsIfAssignmentBecameFull(assignmentId, 1, NOW);
    // Rückzug und erneute Bewerbung: der Vorher-Wert liegt wieder darunter.
    await bed.notifier.notifyCoordinatorsIfAssignmentBecameFull(assignmentId, 1, NOW);

    assert.lengthOf(bed.notificationsFor("koordinator"), 2);
    assert.lengthOf(bed.mailer.sent, 2);
  });

  it("ignores assignments without a user goal", async function () {
    const bed = new TestBed();
    bed.addUser("koordinator", { notificationAsEmail: true });
    bed.addUser("anna", {});
    const assignmentId = bed.addGroupWithAssignment({
      coordinators: ["koordinator"],
      start: daysFromNow(2),
      userGoal: 0,
      applicants: ["anna"],
    });

    await bed.notifier.notifyCoordinatorsIfAssignmentBecameFull(assignmentId, 0, NOW);

    assert.lengthOf(bed.notificationsFor("koordinator"), 0);
  });

  it("ignores assignments that are not open", async function () {
    const bed = new TestBed();
    bed.addUser("koordinator", { notificationAsEmail: true });
    bed.addUser("anna", {});
    const assignmentId = bed.addGroupWithAssignment({
      coordinators: ["koordinator"],
      start: daysFromNow(2),
      userGoal: 1,
      applicants: ["anna"],
      state: "Canceled",
    });

    await bed.notifier.notifyCoordinatorsIfAssignmentBecameFull(assignmentId, 0, NOW);

    assert.lengthOf(bed.notificationsFor("koordinator"), 0);
  });

  it("stays silent when the goal is reached by participants only", async function () {
    const bed = new TestBed();
    bed.addUser("koordinator", { notificationAsEmail: true });
    bed.addUser("anna", {});
    const assignmentId = bed.addGroupWithAssignment({
      coordinators: ["koordinator"],
      start: daysFromNow(2),
      userGoal: 1,
      participants: ["anna"],
    });

    // Niemand zu bestätigen — die Aufforderung wäre gegenstandslos.
    await bed.notifier.notifyCoordinatorsIfAssignmentBecameFull(assignmentId, 0, NOW);

    assert.lengthOf(bed.notificationsFor("koordinator"), 0);
    assert.lengthOf(bed.mailer.sent, 0);
  });

  it("respects mode 'none'", async function () {
    const bed = new TestBed();
    bed.addUser("koordinator", { fullNotifyMode: "none" });
    bed.addUser("anna", {});
    const assignmentId = bed.addGroupWithAssignment({
      coordinators: ["koordinator"],
      start: daysFromNow(1),
      userGoal: 1,
      applicants: ["anna"],
    });

    await bed.notifier.notifyCoordinatorsIfAssignmentBecameFull(assignmentId, 0, NOW);

    assert.lengthOf(bed.notificationsFor("koordinator"), 0);
    assert.lengthOf(bed.mailer.sent, 0);
  });

  it("mode 'nearOnly' skips assignments beyond the configured window", async function () {
    const bed = new TestBed();
    bed.addUser("koordinator", { fullNotifyMode: "nearOnly", fullNotifyDays: 7 });
    bed.addUser("anna", {});
    const assignmentId = bed.addGroupWithAssignment({
      coordinators: ["koordinator"],
      start: daysFromNow(10),
      userGoal: 1,
      applicants: ["anna"],
    });

    await bed.notifier.notifyCoordinatorsIfAssignmentBecameFull(assignmentId, 0, NOW);

    assert.lengthOf(bed.notificationsFor("koordinator"), 0);
  });

  it("mode 'nearOnly' notifies for assignments inside the window", async function () {
    const bed = new TestBed();
    bed.addUser("koordinator", { fullNotifyMode: "nearOnly", fullNotifyDays: 7 });
    bed.addUser("anna", {});
    const assignmentId = bed.addGroupWithAssignment({
      coordinators: ["koordinator"],
      start: daysFromNow(3),
      userGoal: 1,
      applicants: ["anna"],
    });

    await bed.notifier.notifyCoordinatorsIfAssignmentBecameFull(assignmentId, 0, NOW);

    assert.lengthOf(bed.notificationsFor("koordinator"), 1);
  });

  it("suppresses the email (not the in-app notification) when email opt-out is set", async function () {
    const bed = new TestBed();
    bed.addUser("koordinator", { notificationAsEmail: false });
    bed.addUser("anna", {});
    const assignmentId = bed.addGroupWithAssignment({
      coordinators: ["koordinator"],
      start: daysFromNow(2),
      userGoal: 1,
      applicants: ["anna"],
    });

    await bed.notifier.notifyCoordinatorsIfAssignmentBecameFull(assignmentId, 0, NOW);

    assert.lengthOf(bed.notificationsFor("koordinator"), 1);
    assert.lengthOf(bed.mailer.sent, 0);
  });

  it("notifies every coordinator, including one who applied themselves", async function () {
    const bed = new TestBed();
    bed.addUser("koordinatorA", {});
    bed.addUser("koordinatorB", {});
    const assignmentId = bed.addGroupWithAssignment({
      coordinators: ["koordinatorA", "koordinatorB"],
      start: daysFromNow(2),
      userGoal: 1,
      applicants: ["koordinatorB"],
    });

    // Anders als bei der früheren Bewerbungs-Nachricht ist der Bewerber hier
    // nicht ausgenommen: dass der Termin voll ist, betrifft ihn als
    // Koordinator genauso.
    await bed.notifier.notifyCoordinatorsIfAssignmentBecameFull(assignmentId, 0, NOW);

    assert.lengthOf(bed.notificationsFor("koordinatorA"), 1);
    assert.lengthOf(bed.notificationsFor("koordinatorB"), 1);
  });
});

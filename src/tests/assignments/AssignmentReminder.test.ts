import { assert } from "chai";

import { AssignmentDAO } from "../../collections/lib/AssignmentsCollection";
import { AssignmentCopyActionDAO } from "../../collections/lib/AssignmentCopyActionsCollection";
import { GroupDAO } from "../../collections/lib/GroupCollection";
import { NotificationDAO } from "../../collections/lib/classes/UserNotification";
import { UserDAO } from "../../collections/lib/UserCollection";
import { SimpleCollection } from "../../imports/interfaces/SimpleCollection";
import { IUserMailer, IUserMailerOptions } from "../../server/mailing/interfaces/IUserMailer";
import { IAssignmentReminder } from "../../server/assignments/classes/AssignmentReminder";
import { buildServices } from "../../server/services";
import { LocalCollection } from "../3rdParty/minimongo-standalone/minimongo-standalone";
import { NullEmailSender } from "../common/NullEmailSender";

const NOW = new Date("2026-07-09T10:00:00Z");
const hoursFromNow = (h: number) => new Date(NOW.getTime() + h * 60 * 60 * 1000);

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
  public reminder: IAssignmentReminder;

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
    this.reminder = services.assignmentReminder;
  }

  addUser(id: string, profile: object = {}): string {
    return this.users.insert({
      _id: id,
      profile: { first_name: id, last_name: "Test", language: "de-de", ...profile },
    } as any);
  }

  addAssignment(options: {
    start: Date;
    participants?: string[];
    state?: string;
    remindersSentAt?: Date;
  }): string {
    const groupId = this.groups.insert({ name: "Testgruppe", coordinators: [] } as any);
    return this.assignments.insert({
      name: "Trolley Bahnhof",
      group: groupId,
      start: options.start,
      end: new Date(options.start.getTime() + 2 * 60 * 60 * 1000),
      state: options.state ?? "Online",
      participants: (options.participants ?? []).map((user) => ({ user })),
      applicants: [],
      ...(options.remindersSentAt ? { remindersSentAt: options.remindersSentAt } : {}),
    } as any);
  }

  notificationsFor(userId: string): NotificationDAO[] {
    return this.notifications.find({ userId }).fetch();
  }
}

describe("AssignmentReminder", function () {
  it("reminds participants of assignments starting within the window (in-app + email)", async function () {
    const bed = new TestBed();
    bed.addUser("teilnehmer", { notificationAsEmail: true });
    const assignmentId = bed.addAssignment({
      start: hoursFromNow(12),
      participants: ["teilnehmer"],
    });

    const count = await bed.reminder.sendDueReminders(NOW);

    assert.equal(count, 1);
    const inApp = bed.notificationsFor("teilnehmer");
    assert.lengthOf(inApp, 1);
    assert.equal(inApp[0].simpleData!.title, "Erinnerung an deinen Einsatz");
    assert.include(inApp[0].simpleData!.details, "Trolley Bahnhof");
    assert.equal(inApp[0].simpleData!.link, `/einsatz/${assignmentId}`);

    assert.lengthOf(bed.mailer.sent, 1);
    assert.include(bed.mailer.sent[0].subject, "Erinnerung");
    assert.include(bed.mailer.sent[0].subject, "Trolley Bahnhof");
  });

  it("is idempotent: a second run does not remind again", async function () {
    const bed = new TestBed();
    bed.addUser("teilnehmer");
    bed.addAssignment({ start: hoursFromNow(12), participants: ["teilnehmer"] });

    await bed.reminder.sendDueReminders(NOW);
    const secondRun = await bed.reminder.sendDueReminders(NOW);

    assert.equal(secondRun, 0);
    assert.lengthOf(bed.notificationsFor("teilnehmer"), 1);
  });

  it("stamps remindersSentAt on the assignment", async function () {
    const bed = new TestBed();
    bed.addUser("teilnehmer");
    const assignmentId = bed.addAssignment({
      start: hoursFromNow(12),
      participants: ["teilnehmer"],
    });

    await bed.reminder.sendDueReminders(NOW);

    const assignment = bed.assignments.findOne({ _id: assignmentId })!;
    assert.instanceOf(assignment.remindersSentAt, Date);
  });

  it("skips assignments outside the window, in the past, canceled or without participants", async function () {
    const bed = new TestBed();
    bed.addUser("teilnehmer");
    bed.addAssignment({ start: hoursFromNow(48), participants: ["teilnehmer"] }); // zu weit weg
    bed.addAssignment({ start: hoursFromNow(-1), participants: ["teilnehmer"] }); // vorbei
    bed.addAssignment({
      start: hoursFromNow(12),
      participants: ["teilnehmer"],
      state: "Canceled",
    });
    bed.addAssignment({ start: hoursFromNow(12), participants: [] }); // niemand da

    const count = await bed.reminder.sendDueReminders(NOW);

    assert.equal(count, 0);
    assert.lengthOf(bed.notificationsFor("teilnehmer"), 0);
  });

  it("suppresses the email (not the in-app notification) when email opt-out is set", async function () {
    const bed = new TestBed();
    bed.addUser("teilnehmer", { notificationAsEmail: false });
    bed.addAssignment({ start: hoursFromNow(12), participants: ["teilnehmer"] });

    await bed.reminder.sendDueReminders(NOW);

    assert.lengthOf(bed.notificationsFor("teilnehmer"), 1);
    assert.lengthOf(bed.mailer.sent, 0);
  });

  it("reminds every participant of a due assignment", async function () {
    const bed = new TestBed();
    bed.addUser("a");
    bed.addUser("b");
    bed.addAssignment({ start: hoursFromNow(6), participants: ["a", "b"] });

    const count = await bed.reminder.sendDueReminders(NOW);

    assert.equal(count, 1);
    assert.lengthOf(bed.notificationsFor("a"), 1);
    assert.lengthOf(bed.notificationsFor("b"), 1);
  });
});

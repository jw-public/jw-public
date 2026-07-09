import { assert } from "chai";

import { AssignmentDAO } from "../../collections/lib/AssignmentsCollection";
import { AssignmentCopyActionDAO } from "../../collections/lib/AssignmentCopyActionsCollection";
import { GroupDAO } from "../../collections/lib/GroupCollection";
import { NotificationDAO } from "../../collections/lib/classes/UserNotification";
import { UserDAO } from "../../collections/lib/UserCollection";
import { SimpleCollection } from "../../imports/interfaces/SimpleCollection";
import { IUserMailer, IUserMailerOptions } from "../../server/mailing/interfaces/IUserMailer";
import { IApplicationCoordinatorNotifier } from "../../server/assignments/classes/ApplicationCoordinatorNotifier";
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
  public notifier: IApplicationCoordinatorNotifier;

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
    this.notifier = services.applicationCoordinatorNotifier;
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
    groupEmail?: string;
  }): string {
    const groupId = this.groups.insert({
      name: "Testgruppe",
      coordinators: options.coordinators,
      email: options.groupEmail,
    } as any);
    return this.assignments.insert({
      name: "Trolley Bahnhof",
      group: groupId,
      start: options.start,
      end: new Date(options.start.getTime() + 2 * 60 * 60 * 1000),
    } as any);
  }

  notificationsFor(userId: string): NotificationDAO[] {
    return this.notifications.find({ userId }).fetch();
  }
}

describe("ApplicationCoordinatorNotifier", function () {
  it("notifies a coordinator in-app and via email about a new application", async function () {
    const bed = new TestBed();
    bed.addUser("koordinator", { notificationAsEmail: true });
    bed.addUser("bewerber", {});
    const assignmentId = bed.addGroupWithAssignment({
      coordinators: ["koordinator"],
      start: daysFromNow(2),
      groupEmail: "gruppe@jw-public.org",
    });

    await bed.notifier.notifyCoordinatorsAboutApplication(assignmentId, "bewerber", NOW);

    const inApp = bed.notificationsFor("koordinator");
    assert.lengthOf(inApp, 1);
    assert.equal(inApp[0].simpleData!.title, "Neue Bewerbung");
    assert.include(inApp[0].simpleData!.details, "bewerber Test");
    assert.include(inApp[0].simpleData!.details, "Trolley Bahnhof");
    assert.equal(inApp[0].simpleData!.link, `/einsatz/${assignmentId}`);

    assert.lengthOf(bed.mailer.sent, 1);
    assert.equal(bed.mailer.sent[0].recepientId, "koordinator");
    assert.include(bed.mailer.sent[0].subject, "Neue Bewerbung");
    assert.include(bed.mailer.sent[0].subject, "Trolley Bahnhof");
    assert.equal(bed.mailer.sent[0].replyToAddress, "gruppe@jw-public.org");
  });

  it("does not notify the applicant about their own application", async function () {
    const bed = new TestBed();
    bed.addUser("koordinator", {});
    const assignmentId = bed.addGroupWithAssignment({
      coordinators: ["koordinator"],
      start: daysFromNow(2),
    });

    await bed.notifier.notifyCoordinatorsAboutApplication(assignmentId, "koordinator", NOW);

    assert.lengthOf(bed.notificationsFor("koordinator"), 0);
    assert.lengthOf(bed.mailer.sent, 0);
  });

  it("respects mode 'none'", async function () {
    const bed = new TestBed();
    bed.addUser("koordinator", { applicationNotifyMode: "none" });
    bed.addUser("bewerber", {});
    const assignmentId = bed.addGroupWithAssignment({
      coordinators: ["koordinator"],
      start: daysFromNow(1),
    });

    await bed.notifier.notifyCoordinatorsAboutApplication(assignmentId, "bewerber", NOW);

    assert.lengthOf(bed.notificationsFor("koordinator"), 0);
    assert.lengthOf(bed.mailer.sent, 0);
  });

  it("mode 'nearOnly' skips assignments beyond the configured window", async function () {
    const bed = new TestBed();
    bed.addUser("koordinator", { applicationNotifyMode: "nearOnly", applicationNotifyDays: 7 });
    bed.addUser("bewerber", {});
    const assignmentId = bed.addGroupWithAssignment({
      coordinators: ["koordinator"],
      start: daysFromNow(10),
    });

    await bed.notifier.notifyCoordinatorsAboutApplication(assignmentId, "bewerber", NOW);

    assert.lengthOf(bed.notificationsFor("koordinator"), 0);
  });

  it("mode 'nearOnly' notifies for assignments inside the window", async function () {
    const bed = new TestBed();
    bed.addUser("koordinator", { applicationNotifyMode: "nearOnly", applicationNotifyDays: 7 });
    bed.addUser("bewerber", {});
    const assignmentId = bed.addGroupWithAssignment({
      coordinators: ["koordinator"],
      start: daysFromNow(3),
    });

    await bed.notifier.notifyCoordinatorsAboutApplication(assignmentId, "bewerber", NOW);

    assert.lengthOf(bed.notificationsFor("koordinator"), 1);
  });

  it("suppresses the email (not the in-app notification) when email opt-out is set", async function () {
    const bed = new TestBed();
    bed.addUser("koordinator", { notificationAsEmail: false });
    bed.addUser("bewerber", {});
    const assignmentId = bed.addGroupWithAssignment({
      coordinators: ["koordinator"],
      start: daysFromNow(2),
    });

    await bed.notifier.notifyCoordinatorsAboutApplication(assignmentId, "bewerber", NOW);

    assert.lengthOf(bed.notificationsFor("koordinator"), 1);
    assert.lengthOf(bed.mailer.sent, 0);
  });

  it("notifies every coordinator except the applicant", async function () {
    const bed = new TestBed();
    bed.addUser("koordinatorA", {});
    bed.addUser("koordinatorB", {});
    bed.addUser("bewerber", {});
    const assignmentId = bed.addGroupWithAssignment({
      coordinators: ["koordinatorA", "koordinatorB", "bewerber"],
      start: daysFromNow(2),
    });

    await bed.notifier.notifyCoordinatorsAboutApplication(assignmentId, "bewerber", NOW);

    assert.lengthOf(bed.notificationsFor("koordinatorA"), 1);
    assert.lengthOf(bed.notificationsFor("koordinatorB"), 1);
    assert.lengthOf(bed.notificationsFor("bewerber"), 0);
  });
});

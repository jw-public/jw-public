import moment from "moment";

import { AssignmentDAO } from "../../../collections/lib/AssignmentsCollection";
import { GroupDAO } from "../../../collections/lib/GroupCollection";
import { NotificationDAO } from "../../../collections/lib/classes/UserNotification";
import { ApplicationNotifyMode, UserDAO } from "../../../collections/lib/UserCollection";
import { SimpleCollection } from "../../../imports/interfaces/SimpleCollection";
import { Logger } from "../../../imports/logging/Logger";
import { LoggerFactory } from "../../../imports/logging/LoggerFactory";
import { IUserMailer } from "../../mailing/interfaces/IUserMailer";
import { IUserSettingsReaderFactory } from "../../user/interfaces/IUserSettingsReaderFactory";

export interface IApplicationCoordinatorNotifier {
  notifyCoordinatorsAboutApplication(
    assignmentId: string,
    applicantId: string,
    now?: Date,
  ): Promise<void>;
}

/**
 * Benachrichtigt die Koordinatoren einer Gruppe über eine neue Bewerbung auf
 * einen Einsatz: In-App immer (sofern nicht abbestellt), E-Mail zusätzlich
 * bei aktiviertem notificationAsEmail. Jeder Koordinator steuert das selbst
 * über profile.applicationNotifyMode / applicationNotifyDays:
 * - "all" (Default): jede Bewerbung
 * - "nearOnly": nur wenn der Einsatz in den nächsten X Tagen beginnt
 * - "none": nie
 * Der Bewerber selbst wird nie benachrichtigt (Selbstbewerbung eines
 * Koordinators erzeugt sonst Rauschen).
 */
export class ApplicationCoordinatorNotifier implements IApplicationCoordinatorNotifier {
  private logger: Logger;

  constructor(
    private assignments: SimpleCollection<AssignmentDAO>,
    private users: SimpleCollection<UserDAO>,
    private groups: SimpleCollection<GroupDAO>,
    private notifications: SimpleCollection<NotificationDAO>,
    private userMailer: IUserMailer,
    private userSettingsReaderFactory: IUserSettingsReaderFactory,
    loggerFactory: LoggerFactory,
  ) {
    this.logger = loggerFactory.createLogger("ApplicationCoordinatorNotifier");
  }

  public async notifyCoordinatorsAboutApplication(
    assignmentId: string,
    applicantId: string,
    now: Date = new Date(),
  ): Promise<void> {
    const assignment = await this.assignments.findOneAsync({ _id: assignmentId });
    if (!assignment) {
      return;
    }
    const group = await this.groups.findOneAsync({ _id: assignment.group });
    const applicant = await this.users.findOneAsync({ _id: applicantId });
    const applicantName = this.fullName(applicant) ?? "Ein Verkündiger";

    const coordinatorIds = (group?.coordinators ?? []).filter((id) => id !== applicantId);
    for (const coordinatorId of coordinatorIds) {
      try {
        await this.notifyCoordinator(coordinatorId, assignment, applicantName, group, now);
      } catch (error) {
        // Ein kaputter Empfänger darf weder die Bewerbung noch die übrigen
        // Koordinatoren blockieren.
        this.logger.error(
          `Failed to notify coordinator ${coordinatorId} about application on ${assignmentId}: ${error}`,
        );
      }
    }
  }

  private async notifyCoordinator(
    coordinatorId: string,
    assignment: AssignmentDAO,
    applicantName: string,
    group: GroupDAO | undefined,
    now: Date,
  ): Promise<void> {
    const coordinator = await this.users.findOneAsync({ _id: coordinatorId });
    if (!coordinator) {
      return;
    }

    const mode: ApplicationNotifyMode = coordinator.profile?.applicationNotifyMode ?? "all";
    if (mode === "none") {
      return;
    }
    if (mode === "nearOnly") {
      const days = coordinator.profile?.applicationNotifyDays ?? 7;
      const windowEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      if (assignment.start > windowEnd) {
        return;
      }
    }

    // In-App-Benachrichtigung (Texte in-App sind app-weit deutsch). Der
    // type-String ist wie im AssignmentNotifier hartkodiert: ein Wert-Import
    // aus UserNotification zöge dessen Meteor-Kette in die Node-Unit-Tests.
    await this.notifications.insertAsync({
      type: "Simple",
      userId: coordinatorId,
      simpleData: {
        title: "Neue Bewerbung",
        details:
          `${applicantName} hat sich auf den Einsatz "${assignment.name}" ` +
          `am ${moment(assignment.start).format("L LT")} beworben.`,
        icon: "fa fa-user-plus",
        hasLink: true,
        link: `/einsatz/${assignment._id}`,
      },
    });

    // E-Mail nur bei aktiviertem Opt-in, lokalisiert in der Sprache des
    // Koordinators (gleiches Muster wie AssignmentEmailNotifier).
    const settings = await this.userSettingsReaderFactory.createSettingsReaderFor(coordinatorId);
    if (!settings.wantsToReceiveNotificationAsEmail()) {
      return;
    }
    const i18n = settings.getI18nProvider();
    const locale = i18n.getI18n();
    const date = i18n.getDateParser().getLongDateTimeAsString(assignment.start);
    const assignmentUrl = `${process.env.ROOT_URL}/einsatz/${assignment._id}`;

    await this.userMailer.send({
      recepientId: coordinatorId,
      subject: locale.applicationEmail.subject(assignment.name, date),
      markdownContent: `${locale.hello} ${coordinator.profile?.first_name ?? ""},

${locale.applicationEmail.message(applicantName, assignment.name, date)}

${locale.applicationEmail.linkToAssignment}: ${assignmentUrl}`,
      replyToAddress: group?.email,
    });
  }

  private fullName(user: UserDAO | undefined): string | undefined {
    const first = user?.profile?.first_name;
    const last = user?.profile?.last_name;
    const name = [first, last].filter(Boolean).join(" ");
    return name.length > 0 ? name : undefined;
  }
}

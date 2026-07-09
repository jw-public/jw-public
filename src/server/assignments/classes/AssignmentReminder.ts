import moment from "moment";

import { AssignmentDAO } from "../../../collections/lib/AssignmentsCollection";
import { AssignmentState } from "../../../collections/lib/classes/AssignmentState";
import { GroupDAO } from "../../../collections/lib/GroupCollection";
import { NotificationDAO } from "../../../collections/lib/classes/UserNotification";
import { UserDAO } from "../../../collections/lib/UserCollection";
import { SimpleCollection } from "../../../imports/interfaces/SimpleCollection";
import { Logger } from "../../../imports/logging/Logger";
import { LoggerFactory } from "../../../imports/logging/LoggerFactory";
import { IUserMailer } from "../../mailing/interfaces/IUserMailer";
import { IUserSettingsReaderFactory } from "../../user/interfaces/IUserSettingsReaderFactory";

export interface IAssignmentReminder {
  sendDueReminders(now?: Date): Promise<number>;
}

/**
 * Erinnert Teilnehmer an bevorstehende Einsätze: alle Einsätze, die innerhalb
 * des Erinnerungsfensters (Default 24h) beginnen, noch nicht erinnert wurden
 * und nicht abgesagt sind. Pro Teilnehmer: In-App-Benachrichtigung immer,
 * E-Mail zusätzlich bei aktiviertem notificationAsEmail (lokalisiert).
 *
 * Idempotenz: `remindersSentAt` wird VOR dem Versand gestempelt (claim
 * first) — ein Crash mitten im Versand kostet schlimmstenfalls einzelne
 * Erinnerungen, erzeugt aber nie Duplikat-Spam. Der Stempel wird mit
 * bypassCollection2 geschrieben, damit weder updatedAt noch die
 * participants/applicants-AutoValues angefasst werden (eine Erinnerung ist
 * keine inhaltliche Änderung des Termins).
 */
export class AssignmentReminder implements IAssignmentReminder {
  private logger: Logger;

  constructor(
    private assignments: SimpleCollection<AssignmentDAO>,
    private users: SimpleCollection<UserDAO>,
    private groups: SimpleCollection<GroupDAO>,
    private notifications: SimpleCollection<NotificationDAO>,
    private userMailer: IUserMailer,
    private userSettingsReaderFactory: IUserSettingsReaderFactory,
    loggerFactory: LoggerFactory,
    private windowHours: number = 24,
  ) {
    this.logger = loggerFactory.createLogger("AssignmentReminder");
  }

  /** @returns Anzahl der Einsätze, für die Erinnerungen verschickt wurden. */
  public async sendDueReminders(now: Date = new Date()): Promise<number> {
    const windowEnd = new Date(now.getTime() + this.windowHours * 60 * 60 * 1000);

    const due = (
      await this.assignments
        .find({
          start: { $gt: now, $lte: windowEnd },
          remindersSentAt: { $exists: false },
          state: { $ne: AssignmentState[AssignmentState.Canceled] },
        })
        .fetchAsync()
    ).filter((assignment) => (assignment.participants ?? []).length > 0);

    let remindedCount = 0;
    for (const assignment of due) {
      // Claim first: Stempeln vor dem Versand verhindert Duplikate, falls
      // ein zweiter Lauf parallel startet oder der Versand abbricht.
      const claimed = await this.assignments.updateAsync(
        { _id: assignment._id, remindersSentAt: { $exists: false } },
        { $set: { remindersSentAt: now } },
        { bypassCollection2: true } as any,
      );
      if (claimed === 0) {
        continue;
      }
      remindedCount++;

      for (const participant of assignment.participants) {
        try {
          await this.remindParticipant(participant.user, assignment);
        } catch (error) {
          this.logger.error(
            `Failed to remind user ${participant.user} about assignment ${assignment._id}: ${error}`,
          );
        }
      }
    }
    return remindedCount;
  }

  private async remindParticipant(userId: string, assignment: AssignmentDAO): Promise<void> {
    // In-App-Benachrichtigung (Texte in-App sind app-weit deutsch). Der
    // type-String ist wie im AssignmentNotifier hartkodiert: ein Wert-Import
    // aus UserNotification zöge dessen Meteor-Kette in die Node-Unit-Tests.
    await this.notifications.insertAsync({
      type: "Simple",
      userId,
      simpleData: {
        title: "Erinnerung an deinen Einsatz",
        details:
          `Dein Einsatz "${assignment.name}" ` +
          `am ${moment(assignment.start).format("L LT")} steht bevor.`,
        icon: "fa fa-clock-o",
        hasLink: true,
        link: `/einsatz/${assignment._id}`,
      },
    });

    const settings = await this.userSettingsReaderFactory.createSettingsReaderFor(userId);
    if (!settings.wantsToReceiveNotificationAsEmail()) {
      return;
    }
    const user = await this.users.findOneAsync({ _id: userId });
    if (!user) {
      return;
    }
    const group = await this.groups.findOneAsync({ _id: assignment.group });
    const i18n = settings.getI18nProvider();
    const locale = i18n.getI18n();
    const date = i18n.getDateParser().getLongDateTimeAsString(assignment.start);
    const assignmentUrl = `${process.env.ROOT_URL}/einsatz/${assignment._id}`;

    await this.userMailer.send({
      recepientId: userId,
      subject: locale.reminderEmail.subject(assignment.name, date),
      markdownContent: `${locale.hello} ${user.profile?.first_name ?? ""},

${locale.reminderEmail.message(assignment.name, date)}

${locale.reminderEmail.linkToAssignment}: ${assignmentUrl}`,
      replyToAddress: group?.email,
    });
  }
}

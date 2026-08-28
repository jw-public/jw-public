import { AssignmentDAO } from "../../../collections/lib/AssignmentsCollection";
import { AssignmentState } from "../../../collections/lib/classes/AssignmentState";
import { GroupDAO } from "../../../collections/lib/GroupCollection";
import { NotificationDAO } from "../../../collections/lib/classes/UserNotification";
import { FullNotifyMode, UserDAO } from "../../../collections/lib/UserCollection";
import { SimpleCollection } from "../../../imports/interfaces/SimpleCollection";
import { Logger } from "../../../imports/logging/Logger";
import { LoggerFactory } from "../../../imports/logging/LoggerFactory";
import { IUserMailer } from "../../mailing/interfaces/IUserMailer";
import { IUserSettingsReaderFactory } from "../../user/interfaces/IUserSettingsReaderFactory";

export interface IAssignmentFullNotifier {
  notifyCoordinatorsIfAssignmentBecameFull(
    assignmentId: string,
    totalUsersBefore: number,
    now?: Date,
  ): Promise<void>;
}

/**
 * Benachrichtigt die Koordinatoren einer Gruppe, sobald ein Termin voll wird —
 * also Bewerber und Teilnehmer zusammen die Sollzahl erreichen und der Termin
 * noch offen ist. Erst dann gibt es etwas zu tun: die Bewerber bestätigen und
 * den Termin schließen.
 *
 * Bis Version 2.1 löste stattdessen jede einzelne Bewerbung eine
 * Benachrichtigung aus (In-App und E-Mail) — bei Sollzahl 3 also drei
 * Nachrichten für einen einzigen handlungsrelevanten Moment. Siehe
 * ADR 0006 für die Entscheidung und die bewusst offen gelassenen Lücken.
 *
 * Der Übergang wird über den Vorher-Wert erkannt: lag die Besetzung vorher
 * unter der Sollzahl und liegt sie jetzt darauf oder darüber, ist der Termin
 * gerade voll geworden. Damit braucht es kein Zustandsfeld am Termin, und ein
 * Termin, der nach einem Rückzug erneut voll wird, meldet sich erneut.
 *
 * Jeder Koordinator steuert selbst über profile.fullNotifyMode /
 * fullNotifyDays:
 * - "all" (Default): jeder volle Termin
 * - "nearOnly": nur wenn der Termin in den nächsten X Tagen beginnt
 * - "none": nie
 */
export class AssignmentFullNotifier implements IAssignmentFullNotifier {
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
    this.logger = loggerFactory.createLogger("AssignmentFullNotifier");
  }

  public async notifyCoordinatorsIfAssignmentBecameFull(
    assignmentId: string,
    totalUsersBefore: number,
    now: Date = new Date(),
  ): Promise<void> {
    const assignment = await this.assignments.findOneAsync({ _id: assignmentId });
    if (!assignment || !this.becameFull(assignment, totalUsersBefore)) {
      return;
    }

    // Ohne unbestätigte Bewerber wäre die Aufforderung gegenstandslos. In der
    // Praxis kaum anzutreffen — beim Schließen leert der AssignmentCloser die
    // Bewerberliste und setzt den Zustand auf "Closed".
    const applicantNames = await this.applicantNames(assignment);
    if (applicantNames.length === 0) {
      return;
    }

    const group = await this.groups.findOneAsync({ _id: assignment.group });

    for (const coordinatorId of group?.coordinators ?? []) {
      try {
        await this.notifyCoordinator(coordinatorId, assignment, applicantNames, group, now);
      } catch (error) {
        // Ein kaputter Empfänger darf weder die Bewerbung noch die übrigen
        // Koordinatoren blockieren.
        this.logger.error(
          `Failed to notify coordinator ${coordinatorId} about full assignment ${assignmentId}: ${error}`,
        );
      }
    }
  }

  /**
   * Ein Termin ist gerade voll geworden, wenn er offen ist, eine Sollzahl hat,
   * vorher darunter lag und jetzt darauf oder darüber.
   */
  private becameFull(assignment: AssignmentDAO, totalUsersBefore: number): boolean {
    if (assignment.state !== AssignmentState[AssignmentState.Online]) {
      return false;
    }

    const userGoal = assignment.userGoal ?? 0;
    if (userGoal <= 0) {
      return false;
    }

    const totalUsersNow =
      (assignment.applicants ?? []).length + (assignment.participants ?? []).length;

    return totalUsersBefore < userGoal && totalUsersNow >= userGoal;
  }

  /** Die zu bestätigenden Personen, in der Reihenfolge ihrer Bewerbung. */
  private async applicantNames(assignment: AssignmentDAO): Promise<string[]> {
    const names: string[] = [];

    for (const entry of assignment.applicants ?? []) {
      const user = await this.users.findOneAsync({ _id: entry.user });
      names.push(this.fullName(user) ?? "Ein Verkündiger");
    }

    return names;
  }

  private async notifyCoordinator(
    coordinatorId: string,
    assignment: AssignmentDAO,
    applicantNames: string[],
    group: GroupDAO | undefined,
    now: Date,
  ): Promise<void> {
    const coordinator = await this.users.findOneAsync({ _id: coordinatorId });
    if (!coordinator) {
      return;
    }

    const mode: FullNotifyMode = coordinator.profile?.fullNotifyMode ?? "all";
    if (mode === "none") {
      return;
    }
    if (mode === "nearOnly") {
      const days = coordinator.profile?.fullNotifyDays ?? 7;
      const windowEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      if (assignment.start > windowEnd) {
        return;
      }
    }

    const settings = await this.userSettingsReaderFactory.createSettingsReaderFor(coordinatorId);
    const i18n = settings.getI18nProvider();
    const locale = i18n.getI18n();
    const date = i18n.getDateParser().getLongDateTimeAsString(assignment.start);

    // In-App-Benachrichtigung (Texte in-App sind app-weit deutsch). Der
    // type-String ist wie im AssignmentNotifier hartkodiert: ein Wert-Import
    // aus UserNotification zöge dessen Meteor-Kette in die Node-Unit-Tests.
    await this.notifications.insertAsync({
      type: "Simple",
      userId: coordinatorId,
      simpleData: {
        title: "Termin ist voll",
        details:
          `Der Termin "${assignment.name}" ist voll. ` +
          `Zu bestätigen: ${applicantNames.join(", ")}.`,
        icon: "fa fa-check-circle",
        hasLink: true,
        link: `/einsatz/${assignment._id}`,
      },
    });

    // E-Mail nur bei aktiviertem Opt-in, lokalisiert in der Sprache des
    // Koordinators (gleiches Muster wie AssignmentEmailNotifier). Bewusst nur
    // Namen: die Mail ist ein Anstoß, keine Kopie der Kontaktdaten — die
    // stehen hinter dem Link (ADR 0006).
    if (!settings.wantsToReceiveNotificationAsEmail()) {
      return;
    }
    const assignmentUrl = `${process.env.ROOT_URL}/einsatz/${assignment._id}`;
    const numberedNames = applicantNames.map((name, i) => `${i + 1}. ${name}`).join("\n");

    await this.userMailer.send({
      recepientId: coordinatorId,
      subject: locale.assignmentFullEmail.subject(assignment.name, date),
      markdownContent: `${locale.hello} ${coordinator.profile?.first_name ?? ""},

${locale.assignmentFullEmail.message(assignment.name, date)}

${locale.assignmentFullEmail.toConfirm}:
${numberedNames}

${locale.assignmentFullEmail.linkToAssignment}: ${assignmentUrl}`,
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

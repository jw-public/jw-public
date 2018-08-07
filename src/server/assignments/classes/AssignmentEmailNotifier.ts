import { ILocale } from '../../../imports/i18n/interfaces/ILocale';
import { I18nProvider } from '../../../imports/i18n/classes/I18nProvider';
import { II18nProvider } from '../../../imports/i18n/interfaces/II18nProvider';
import { AssignmentEventType } from "../../../imports/assignments/interfaces/AssignmentEventType";
import { Types } from "../../Types";
import { UserTypes } from "../../user/UserTypes";
import { AssignmentServiceTypes } from "../AssignmentServiceTypes";
import { MailingTypes } from "../../mailing/MailingTypes";
import { IAssignmentSingleNotifierOptions } from "../interfaces/IAssignmentNotifier";
import { IAssignmentDateParser } from "../interfaces/IAssignmentDateParser";
import { IAssignmentEmailNotifier } from "../interfaces/IAssignmentEmailNotifier";
import { IUserMailer } from "../../mailing/interfaces/IUserMailer";
import { IUserSettingsReaderFactory } from "../../user/interfaces/IUserSettingsReaderFactory";
import { injectable, inject, named } from "inversify";
import { UserEntry, AssignmentDAO } from "../../../collections/lib/AssignmentsCollection";
import { SimpleCollection } from "../../../imports/interfaces/SimpleCollection";
import { AssignmentAction } from "./AssignmentAction";
import { UserDAO } from "../../../collections/lib/UserCollection";
import * as moment from 'moment';
import { GroupDAO } from "../../../collections/lib/GroupCollection";

@injectable()
export class AssignmentEmailNotifier extends AssignmentAction implements IAssignmentEmailNotifier {

  constructor(
    @inject(Types.Collection) @named("user") private users: SimpleCollection<UserDAO>,
    @inject(Types.Collection) @named("assignment") collection: SimpleCollection<AssignmentDAO>,
    @inject(Types.Collection) @named("group") private groups: SimpleCollection<GroupDAO>,
    @inject(MailingTypes.IUserMailer) private userMailer: IUserMailer,
    @inject(UserTypes.IUserSettingsReaderFactory) private userSettingsReaderFactory: IUserSettingsReaderFactory,
    @inject(AssignmentServiceTypes.IAssignmentDateParser) private dateParser: IAssignmentDateParser
  ) {
    super(collection);

    moment.locale("de");
  }

  notifyUserAboutAssignmentViaEmail(options: IAssignmentSingleNotifierOptions) {
    let userSettings = this.userSettingsReaderFactory.createSettingsReaderFor(options.userId);

    if (!userSettings.wantsToReceiveNotificationAsEmail()) {
      return;
    }

    let i18n: II18nProvider = userSettings.getI18nProvider()

    this.userMailer.send({
      recepientId: options.userId,
      subject: this.createSubject(options, i18n),
      markdownContent: this.createText(options, i18n),
      replyToAddress: this.getGroupEmail(options)
    });
  }


  private createSubject(options: IAssignmentSingleNotifierOptions, i18n: II18nProvider) {
    let eventName: "accept" | "cancellation" | "modification";
    switch (options.eventType) {
      case AssignmentEventType.Accept:
      case AssignmentEventType.Reenable:
        eventName = "accept";
        break;
      case AssignmentEventType.Cancel:
      case AssignmentEventType.Removed:
        eventName = "cancellation";
        break;
      case AssignmentEventType.Modified:
        eventName = "modification";
        break;
    }
    let assignment = this.getAssignment(options.assignmentId);

    let date: string = i18n.getDateParser().getShortDateTimeAsString(assignment.start);

    let subject: string = i18n.getI18n().assignmentEmail.subject(eventName, assignment.name, date);
    return subject;
  }



  private getGroupEmail(options: IAssignmentSingleNotifierOptions) {
    let assignment = this.getAssignment(options.assignmentId);
    return this.groups.findOne({ _id: assignment.group }).email;
  }

  private createText(options: IAssignmentSingleNotifierOptions, i18nProvider: II18nProvider) {
    let message;
    let assignment = this.getAssignment(options.assignmentId);
    let dateTime = i18nProvider.getDateParser().getLongDateTimeAsString(assignment.start);
    let emailLocale = i18nProvider.getI18n().assignmentEmail;
    let emailMessageLocale = emailLocale.message;
    switch (options.eventType) {
      case AssignmentEventType.Accept:
        message = emailMessageLocale.accepted(assignment.name, dateTime);
        break;
      case AssignmentEventType.Removed:
        message = emailMessageLocale.removed(assignment.name, dateTime);
        break;
      case AssignmentEventType.Modified:
        message = emailMessageLocale.modified(assignment.name, dateTime);
        break;
      case AssignmentEventType.Cancel:
        message = emailMessageLocale.canceled(assignment.name, dateTime, assignment.cancelationReason);
        break;
      case AssignmentEventType.Reenable:
        message = emailMessageLocale.reenabled(assignment.name, dateTime, options.reenablingReason);
        break;


    }


    if (options.eventType !== AssignmentEventType.Removed) {
      let assignmentUrl = `${process.env.ROOT_URL}/einsatz/${options.assignmentId}`
      message = `${message}

${emailLocale.linkToAssignment}: ${assignmentUrl}`;
    }

    let greeting = this.createGreeting(options, i18nProvider.getI18n());

    return `${greeting},

${message}

${emailLocale.footer.closing}

---

${emailLocale.footer.additionalInformation}`;
  }

  private createGreeting(options: IAssignmentSingleNotifierOptions, locale: ILocale) {
    let user = this.users.findOne({ _id: options.userId });
    return `${locale.hello} ${user.profile.first_name}`;
  }


}

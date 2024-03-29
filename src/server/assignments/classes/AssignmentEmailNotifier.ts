import { inject, injectable, named } from "inversify";
import * as moment from 'moment';
import { AssignmentDAO } from "../../../collections/lib/AssignmentsCollection";
import { GroupDAO } from "../../../collections/lib/GroupCollection";
import { UserDAO } from "../../../collections/lib/UserCollection";
import { AssignmentEventType } from "../../../imports/assignments/interfaces/AssignmentEventType";
import { II18nProvider } from '../../../imports/i18n/interfaces/II18nProvider';
import { ILocale } from '../../../imports/i18n/interfaces/ILocale';
import { SimpleCollection } from "../../../imports/interfaces/SimpleCollection";
import { IUserMailer } from "../../mailing/interfaces/IUserMailer";
import { MailingTypes } from "../../mailing/MailingTypes";
import { Types } from "../../Types";
import { IUserSettingsReaderFactory } from "../../user/interfaces/IUserSettingsReaderFactory";
import { UserTypes } from "../../user/UserTypes";
import { AssignmentServiceTypes } from "../AssignmentServiceTypes";
import { IAssignmentDateParser } from "../interfaces/IAssignmentDateParser";
import { IAssignmentEmailNotifier } from "../interfaces/IAssignmentEmailNotifier";
import { IAssignmentSingleNotifierOptions } from "../interfaces/IAssignmentNotifier";
import { AssignmentAction } from "./AssignmentAction";

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
    let replyToAddress = this.getGroupEmail(options);
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
      message = `${message}\n\n${emailLocale.linkToAssignment}: ${assignmentUrl}`;
    }

    let greeting = this.createGreeting(options, i18nProvider.getI18n());
    let footerMessage = emailLocale.footer.replyInformation.concat(replyToAddress);
    if (replyToAddress == null) {
      footerMessage = emailLocale.footer.noReplyInformation;
    }

    let email = `${greeting},

${message}

${emailLocale.footer.closing}

---

${footerMessage}`;

    return email;
  }

  private createGreeting(options: IAssignmentSingleNotifierOptions, locale: ILocale) {
    let user = this.users.findOne({ _id: options.userId });
    return `${locale.hello} ${user.profile.first_name}`;
  }


}

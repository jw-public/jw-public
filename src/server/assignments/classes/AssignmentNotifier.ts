import { NotificationDAO } from "../../../collections/lib/classes/UserNotification";
import { AssignmentEventType } from "../../../imports/assignments/interfaces/AssignmentEventType";
import { SimpleCollection } from "../../../imports/interfaces/SimpleCollection";
import { Logger } from '../../../imports/logging/Logger';
import { LoggerFactory } from '../../../imports/logging/LoggerFactory';
import { Types } from "../../Types";
import { AssignmentServiceTypes } from "../AssignmentServiceTypes";
import { IAssignmentEmailNotifier } from "../interfaces/IAssignmentEmailNotifier";
import { IAssignmentNotifier, IAssignmentSingleNotifierOptions } from "../interfaces/IAssignmentNotifier";


export class AssignmentNotifier implements IAssignmentNotifier {
  private logger: Logger;

  constructor(
    private emailNotifier: IAssignmentEmailNotifier,
    private collection: SimpleCollection<NotificationDAO>,
    loggerFactory: LoggerFactory) {

    if (loggerFactory) {
      this.logger = loggerFactory.createLogger("AssignmentNotifier");
    }

  }

  async notifyUserAboutAssignment(options: IAssignmentSingleNotifierOptions): Promise<void> {
    this.logger.debug("Notify user about assignment with " + JSON.stringify(options));
    this.verifyOptions(options);
    await this.notifyViaDatabaseEntry(options);
    await this.emailNotifier.notifyUserAboutAssignmentViaEmail(options);
  }

  private async notifyViaDatabaseEntry(options: IAssignmentSingleNotifierOptions): Promise<void> {
    await this.collection.insertAsync({
      type: "Assignment",
      userId: options.userId,
      assignmentOptions: {
        id: options.assignmentId,
        type: AssignmentEventType[options.eventType],
        reenablingReason: options.reenablingReason
      }
    });
  }


  private verifyOptions(options: IAssignmentSingleNotifierOptions) {
    if (options.eventType === AssignmentEventType.Reenable && options.reenablingReason === undefined) {
      throw new Error("Reenabling notification needs a reason.");
    }
  }

}

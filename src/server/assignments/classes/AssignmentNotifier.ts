import { inject, injectable, named } from "inversify";
import { NotificationDAO } from "../../../collections/lib/classes/UserNotification";
import { AssignmentEventType } from "../../../imports/assignments/interfaces/AssignmentEventType";
import { SimpleCollection } from "../../../imports/interfaces/SimpleCollection";
import { Logger } from '../../../imports/logging/Logger';
import { LoggerFactory } from '../../../imports/logging/LoggerFactory';
import { Types } from "../../Types";
import { AssignmentServiceTypes } from "../AssignmentServiceTypes";
import { IAssignmentEmailNotifier } from "../interfaces/IAssignmentEmailNotifier";
import { IAssignmentNotifier, IAssignmentSingleNotifierOptions } from "../interfaces/IAssignmentNotifier";


@injectable()
export class AssignmentNotifier implements IAssignmentNotifier {
  private logger: Logger;

  constructor(
    @inject(AssignmentServiceTypes.IAssignmentEmailNotifier) private emailNotifier: IAssignmentEmailNotifier,
    @inject(Types.Collection) @named("notification") private collection: SimpleCollection<NotificationDAO>,
    @inject(Types.LoggerFactory) loggerFactory: LoggerFactory) {

    if (loggerFactory) {
      this.logger = loggerFactory.createLogger("AssignmentNotifier");
    }

  }

  notifyUserAboutAssignment(options: IAssignmentSingleNotifierOptions) {
    this.logger.debug("Notify user about assignment with " + JSON.stringify(options));
    this.verifyOptions(options);
    this.notifyViaDatabaseEntry(options);
    this.emailNotifier.notifyUserAboutAssignmentViaEmail(options);
  }

  private notifyViaDatabaseEntry(options: IAssignmentSingleNotifierOptions) {
    this.collection.insert({
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

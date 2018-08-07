import {AssignmentEventType} from "../../../imports/assignments/interfaces/AssignmentEventType";
import {IAssignmentNotifier} from "../interfaces/IAssignmentNotifier";
import {IAssignmentParticipationNotifier, IAssignmentNotifierOptions} from "../interfaces/IAssignmentParticipationNotifier";
import { injectable, inject, named } from "inversify";
import {AssignmentServiceTypes} from "../AssignmentServiceTypes";

@injectable()
export class AssignmentParticipationNotifier implements IAssignmentParticipationNotifier {

    constructor( @inject(AssignmentServiceTypes.IAssignmentNotifier) private assignmentNotifier: IAssignmentNotifier) {

    }

    notifyUsersAreAccepted(options: IAssignmentNotifierOptions) {

        for (const userId of options.userIds) {
            this.assignmentNotifier.notifyUserAboutAssignment({
                userId,
                assignmentId: options.assignmentId,
                eventType: AssignmentEventType.Accept
            });
        }

    }


    notifyUsersAreNotAccepted(options: IAssignmentNotifierOptions) {
      for (const userId of options.userIds) {
          this.assignmentNotifier.notifyUserAboutAssignment({
              userId,
              assignmentId: options.assignmentId,
              eventType: AssignmentEventType.Removed
          });
      }
    }


}

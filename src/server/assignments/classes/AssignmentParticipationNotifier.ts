import { inject, injectable } from "inversify";
import { AssignmentEventType } from "../../../imports/assignments/interfaces/AssignmentEventType";
import { AssignmentServiceTypes } from "../AssignmentServiceTypes";
import { IAssignmentNotifier } from "../interfaces/IAssignmentNotifier";
import { IAssignmentNotifierOptions, IAssignmentParticipationNotifier } from "../interfaces/IAssignmentParticipationNotifier";

@injectable()
export class AssignmentParticipationNotifier implements IAssignmentParticipationNotifier {

    constructor(@inject(AssignmentServiceTypes.IAssignmentNotifier) private assignmentNotifier: IAssignmentNotifier) {

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

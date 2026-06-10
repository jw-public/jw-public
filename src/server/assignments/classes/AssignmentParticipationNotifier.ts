import { AssignmentEventType } from "../../../imports/assignments/interfaces/AssignmentEventType";
import { AssignmentServiceTypes } from "../AssignmentServiceTypes";
import { IAssignmentNotifier } from "../interfaces/IAssignmentNotifier";
import { IAssignmentNotifierOptions, IAssignmentParticipationNotifier } from "../interfaces/IAssignmentParticipationNotifier";

export class AssignmentParticipationNotifier implements IAssignmentParticipationNotifier {

    constructor(private assignmentNotifier: IAssignmentNotifier) {

    }

    async notifyUsersAreAccepted(options: IAssignmentNotifierOptions): Promise<void> {

        for (const userId of options.userIds) {
            await this.assignmentNotifier.notifyUserAboutAssignment({
                userId,
                assignmentId: options.assignmentId,
                eventType: AssignmentEventType.Accept
            });
        }

    }


    async notifyUsersAreNotAccepted(options: IAssignmentNotifierOptions): Promise<void> {
        for (const userId of options.userIds) {
            await this.assignmentNotifier.notifyUserAboutAssignment({
                userId,
                assignmentId: options.assignmentId,
                eventType: AssignmentEventType.Removed
            });
        }
    }


}

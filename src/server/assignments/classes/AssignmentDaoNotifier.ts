import { inject, injectable } from "inversify";
import { AssignmentServiceTypes } from "../AssignmentServiceTypes";
import { IAssignmentDaoNotifier, IAssignmentMultiNotifierOptions } from "../interfaces/IAssignmentDaoNotifier";
import { IAssignmentNotifier, IAssignmentSingleNotifierOptions } from "../interfaces/IAssignmentNotifier";
import { extractIdsFromUserEntryArray } from "../utils/UserEntryHelper";


@injectable()
export class AssignmentDaoNotifier implements IAssignmentDaoNotifier {

    constructor(@inject(AssignmentServiceTypes.IAssignmentNotifier) private assignmentNotifier: IAssignmentNotifier) {

    }

    public async notifyUsersOfAssignment(options: IAssignmentMultiNotifierOptions): Promise<void> {
        await this.notifyParticipantsOfAssignment(options);
        await this.notifyApplicantsOfAssignment(options);
    }

    public async notifyParticipantsOfAssignment(options: IAssignmentMultiNotifierOptions): Promise<void> {
        let participants = extractIdsFromUserEntryArray(options.assignment.participants);
        await this.notifyUserIds(participants, options);
    }

    public async notifyApplicantsOfAssignment(options: IAssignmentMultiNotifierOptions): Promise<void> {
        let applicants = extractIdsFromUserEntryArray(options.assignment.applicants);
        await this.notifyUserIds(applicants, options);
    }

    private async notifyUserIds(userIds: Array<string>, options: IAssignmentMultiNotifierOptions): Promise<void> {
        for (const userId of userIds) {
            let notifierOptions: IAssignmentSingleNotifierOptions = {
                userId,
                assignmentId: options.assignment._id,
                eventType: options.eventType,
            };

            if (options.reenablingReason) {
                notifierOptions.reenablingReason = options.reenablingReason;
            }

            await this.assignmentNotifier.notifyUserAboutAssignment(notifierOptions);
        }
    }



}

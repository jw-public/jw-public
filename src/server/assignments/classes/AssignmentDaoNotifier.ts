import { inject, injectable } from "inversify";
import { AssignmentServiceTypes } from "../AssignmentServiceTypes";
import { IAssignmentDaoNotifier, IAssignmentMultiNotifierOptions } from "../interfaces/IAssignmentDaoNotifier";
import { IAssignmentNotifier, IAssignmentSingleNotifierOptions } from "../interfaces/IAssignmentNotifier";
import { extractIdsFromUserEntryArray } from "../utils/UserEntryHelper";


@injectable()
export class AssignmentDaoNotifier implements IAssignmentDaoNotifier {

    constructor(@inject(AssignmentServiceTypes.IAssignmentNotifier) private assignmentNotifier: IAssignmentNotifier) {

    }

    public notifyUsersOfAssignment(options: IAssignmentMultiNotifierOptions) {
        this.notifyParticipantsOfAssignment(options);
        this.notifyApplicantsOfAssignment(options);
    }

    public notifyParticipantsOfAssignment(options: IAssignmentMultiNotifierOptions) {
        let participants = extractIdsFromUserEntryArray(options.assignment.participants);
        this.notifyUserIds(participants, options);
    }

    public notifyApplicantsOfAssignment(options: IAssignmentMultiNotifierOptions) {
        let applicants = extractIdsFromUserEntryArray(options.assignment.applicants);
        this.notifyUserIds(applicants, options);
    }

    private notifyUserIds(userIds: Array<string>, options: IAssignmentMultiNotifierOptions) {
        for (const userId of userIds) {
            let notifierOptions: IAssignmentSingleNotifierOptions = {
                userId,
                assignmentId: options.assignment._id,
                eventType: options.eventType,
            };

            if (options.reenablingReason) {
                notifierOptions.reenablingReason = options.reenablingReason;
            }

            this.assignmentNotifier.notifyUserAboutAssignment(notifierOptions);
        }
    }



}

import { AssignmentDAO } from "../../../collections/lib/AssignmentsCollection";
import { AssignmentState } from "../../../collections/lib/classes/AssignmentState";
import { AssignmentEventType } from "../../../imports/assignments/interfaces/AssignmentEventType";
import { SimpleCollection } from "../../../imports/interfaces/SimpleCollection";
import { Types } from "../../Types";
import { AssignmentServiceTypes } from "../AssignmentServiceTypes";
import { IAssignmentCanceler } from "../interfaces/IAssignmentCanceler";
import { IAssignmentDaoNotifier } from "../interfaces/IAssignmentDaoNotifier";
import { AssignmentAction } from "./AssignmentAction";



export class AssignmentCanceler extends AssignmentAction implements IAssignmentCanceler {


    constructor(collection: SimpleCollection<AssignmentDAO>,
        private assignmentNotifier: IAssignmentDaoNotifier) {
        super(collection);
    }

    async cancelAssignment(assignmentId: string, reason: string): Promise<void> {
        let assignment = await this.getAssignment(assignmentId);

        await this.updateDatabaseEntry(assignment, reason);
        await this.assignmentNotifier.notifyParticipantsOfAssignment({
            assignment,
            eventType: AssignmentEventType.Cancel
        });
    }

    private async updateDatabaseEntry(assignment: AssignmentDAO, reason: string): Promise<void> {
        await this.collection.updateAsync({ _id: assignment._id }, {
            $set: {
                state: AssignmentState[AssignmentState.Canceled],
                cancelationReason: reason,
                stateBeforeLastClose: assignment.state
            }
        });
    }
}

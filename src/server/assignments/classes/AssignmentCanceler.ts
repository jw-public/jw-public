import {AssignmentEventType} from "../../../imports/assignments/interfaces/AssignmentEventType";
import {SimpleCollection} from "../../../imports/interfaces/SimpleCollection";
import {Types} from "../../Types";
import {AssignmentServiceTypes} from "../AssignmentServiceTypes";
import {IAssignmentCanceler} from "../interfaces/IAssignmentCanceler";
import {AssignmentAction} from "./AssignmentAction";
import { injectable, inject, named } from "inversify";
import {UserEntry, AssignmentDAO} from "../../../collections/lib/AssignmentsCollection";
import {IAssignmentDaoNotifier} from "../interfaces/IAssignmentDaoNotifier";
import {AssignmentState} from "../../../collections/lib/classes/AssignmentState";



@injectable()
export class AssignmentCanceler extends AssignmentAction implements IAssignmentCanceler {


    constructor( @inject(Types.Collection) @named("assignment") collection: SimpleCollection<AssignmentDAO>,
        @inject(AssignmentServiceTypes.IAssignmentDaoNotifier) private assignmentNotifier: IAssignmentDaoNotifier) {
        super(collection);
    }

    cancelAssignment(assignmentId: string, reason: string): void {
        let assignment = this.getAssignment(assignmentId);

        this.updateDatabaseEntry(assignment, reason);
        this.assignmentNotifier.notifyParticipantsOfAssignment({
          assignment,
          eventType: AssignmentEventType.Cancel
        });
    }

    private updateDatabaseEntry(assignment: AssignmentDAO, reason: string): void {
        this.collection.update({ _id: assignment._id }, {
            $set: {
                state: AssignmentState[AssignmentState.Canceled],
                cancelationReason: reason,
                stateBeforeLastClose: assignment.state
            }
        });
    }
}

import { AssignmentDAO } from "../../../collections/lib/AssignmentsCollection";
import { AssignmentState } from "../../../collections/lib/classes/AssignmentState";
import { AssignmentEventType } from "../../../imports/assignments/interfaces/AssignmentEventType";
import { SimpleCollection } from "../../../imports/interfaces/SimpleCollection";
import { Types } from "../../Types";
import { AssignmentServiceTypes } from "../AssignmentServiceTypes";
import { IAssignmentDaoNotifier } from "../interfaces/IAssignmentDaoNotifier";
import { IAssignmentReenabler } from "../interfaces/IAssignmentReenabler";
import { AssignmentAction } from "./AssignmentAction";


export class AssignmentReenabler extends AssignmentAction implements IAssignmentReenabler {


  constructor(collection: SimpleCollection<AssignmentDAO>,
    private assignmentNotifier: IAssignmentDaoNotifier) {
    super(collection);
  }

  async reenableAssignment(assignmentId: string, reason: string): Promise<void> {
    let assignment = await this.getAssignment(assignmentId);

    await this.updateDatabaseEntry(assignment, reason);
    await this.assignmentNotifier.notifyParticipantsOfAssignment({
      assignment,
      eventType: AssignmentEventType.Reenable,
      reenablingReason: reason
    });
  }

  private async updateDatabaseEntry(assignment: AssignmentDAO, reason: string): Promise<void> {


    await this.collection.updateAsync({ _id: assignment._id }, {
      $set: {
        state: AssignmentState[this.determineDesiredState(assignment)]
      }
    });
  }

  private determineDesiredState(assignment: AssignmentDAO): AssignmentState {
    let state;

    if (this.isValidState(assignment.stateBeforeLastClose)) {
      state = AssignmentState[assignment.stateBeforeLastClose];
    } else {
      state = AssignmentState.Closed;
    }

    return state;
  }

  private isValidState(stateAsString: string): boolean {
    return AssignmentState[stateAsString] !== undefined;
  }
}

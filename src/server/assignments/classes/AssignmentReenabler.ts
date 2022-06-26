import { inject, injectable, named } from "inversify";
import { AssignmentDAO } from "../../../collections/lib/AssignmentsCollection";
import { AssignmentState } from "../../../collections/lib/classes/AssignmentState";
import { AssignmentEventType } from "../../../imports/assignments/interfaces/AssignmentEventType";
import { SimpleCollection } from "../../../imports/interfaces/SimpleCollection";
import { Types } from "../../Types";
import { AssignmentServiceTypes } from "../AssignmentServiceTypes";
import { IAssignmentDaoNotifier } from "../interfaces/IAssignmentDaoNotifier";
import { IAssignmentReenabler } from "../interfaces/IAssignmentReenabler";
import { AssignmentAction } from "./AssignmentAction";


@injectable()
export class AssignmentReenabler extends AssignmentAction implements IAssignmentReenabler {


  constructor(@inject(Types.Collection) @named("assignment") collection: SimpleCollection<AssignmentDAO>,
    @inject(AssignmentServiceTypes.IAssignmentDaoNotifier) private assignmentNotifier: IAssignmentDaoNotifier) {
    super(collection);
  }

  reenableAssignment(assignmentId: string, reason: string): void {
    let assignment = this.getAssignment(assignmentId);

    this.updateDatabaseEntry(assignment, reason);
    this.assignmentNotifier.notifyParticipantsOfAssignment({
      assignment,
      eventType: AssignmentEventType.Reenable,
      reenablingReason: reason
    });
  }

  private updateDatabaseEntry(assignment: AssignmentDAO, reason: string): void {


    this.collection.update({ _id: assignment._id }, {
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

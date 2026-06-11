import { AssignmentEventType } from "../../../imports/assignments/interfaces/AssignmentEventType";
import { SimpleCollection } from "../../../imports/interfaces/SimpleCollection";

import { AssignmentDAO } from "../../../collections/lib/AssignmentsCollection";
import { IAssignmentDaoNotifier } from "../interfaces/IAssignmentDaoNotifier";
import { IAssignmentRemover } from "../interfaces/IAssignmentRemover";

import { AssignmentAction } from "./AssignmentAction";

export class AssignmentRemover extends AssignmentAction implements IAssignmentRemover {
  constructor(
    collection: SimpleCollection<AssignmentDAO>,
    private assignmentNotifier: IAssignmentDaoNotifier,
  ) {
    super(collection);
  }

  async removeAssignment(assignmentId: string): Promise<void> {
    let assignment = await this.getAssignment(assignmentId);

    await this.removeFromDatabase(assignment);
    await this.assignmentNotifier.notifyUsersOfAssignment({
      assignment,
      eventType: AssignmentEventType.Removed,
    });
  }

  private async removeFromDatabase(assignment: AssignmentDAO): Promise<void> {
    let query = { _id: assignment._id };
    await this.collection.removeAsync(query);
  }
}

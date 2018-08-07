import {AssignmentEventType} from "../../../imports/assignments/interfaces/AssignmentEventType";
import {SimpleCollection} from "../../../imports/interfaces/SimpleCollection";
import {Types} from "../../Types";
import {AssignmentServiceTypes} from "../AssignmentServiceTypes";


import {IAssignmentRemover} from "../interfaces/IAssignmentRemover";
import { injectable, inject, named } from "inversify";
import {UserEntry, AssignmentDAO} from "../../../collections/lib/AssignmentsCollection";
import {IAssignmentDaoNotifier} from "../interfaces/IAssignmentDaoNotifier";

import {AssignmentAction} from "./AssignmentAction";

@injectable()
export class AssignmentRemover extends AssignmentAction implements IAssignmentRemover {


    constructor( @inject(Types.Collection) @named("assignment") collection: SimpleCollection<AssignmentDAO>,
        @inject(AssignmentServiceTypes.IAssignmentDaoNotifier) private assignmentNotifier: IAssignmentDaoNotifier) {
        super(collection);
    }

    removeAssignment(assignmentId: string): void {
        let assignment = this.getAssignment(assignmentId);

        this.removeFromDatabase(assignment);
        this.assignmentNotifier.notifyUsersOfAssignment({
          assignment,
          eventType: AssignmentEventType.Removed
        });
    }

    private removeFromDatabase(assignment: AssignmentDAO) {
        let query = { _id: assignment._id };
        this.collection.remove(query);
    }

}

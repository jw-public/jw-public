require("../../Types");
import { injectable } from 'inversify';
import { AssignmentDAO } from '../../../collections/lib/AssignmentsCollection';
import { SimpleCollection } from '../../../imports/interfaces/SimpleCollection';



@injectable()
export class AssignmentAction {


    constructor(protected collection: SimpleCollection<AssignmentDAO>) {

    }

    protected getAssignment(assignmentId: string): AssignmentDAO {
        assignmentId = assignmentId.toString();
        return this.collection.findOne({ _id: assignmentId });
    }
}

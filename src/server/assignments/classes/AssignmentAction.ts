require("../../Types");
import { AssignmentDAO } from '../../../collections/lib/AssignmentsCollection';
import { SimpleCollection } from '../../../imports/interfaces/SimpleCollection';



export class AssignmentAction {


    constructor(protected collection: SimpleCollection<AssignmentDAO>) {

    }

    protected async getAssignment(assignmentId: string): Promise<AssignmentDAO> {
        assignmentId = assignmentId.toString();
        return await this.collection.findOneAsync({ _id: assignmentId });
    }
}

require("../../Types");
import { injectable } from 'inversify';
import { AssignmentDAO } from '../../../collections/lib/AssignmentsCollection';
import { SimpleCollection } from '../../../imports/interfaces/SimpleCollection';



@injectable()
export class AssignmentAction {


    constructor(protected collection: SimpleCollection<AssignmentDAO>) {

    }

    protected async getAssignment(assignmentId: string): Promise<AssignmentDAO> {
        assignmentId = assignmentId.toString();
        return await this.collection.findOneAsync({ _id: assignmentId });
    }
}

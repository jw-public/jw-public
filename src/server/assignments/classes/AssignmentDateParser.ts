import { injectable } from 'inversify';
import { SimpleCollection } from '../../../imports/interfaces/SimpleCollection';
import { AssignmentDAO } from '../../../collections/lib/AssignmentsCollection';
import { IAssignmentDateParser } from "../interfaces/IAssignmentDateParser";
import * as moment from 'moment-timezone';



@injectable()
export class AssignmentDateParser implements IAssignmentDateParser {


    getStartDate(assignment: AssignmentDAO): moment.Moment {
        return moment(assignment.start).tz("Europe/Berlin");
    }

}

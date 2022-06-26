import { injectable } from 'inversify';
import * as moment from 'moment-timezone';
import { AssignmentDAO } from '../../../collections/lib/AssignmentsCollection';
import { IAssignmentDateParser } from "../interfaces/IAssignmentDateParser";



@injectable()
export class AssignmentDateParser implements IAssignmentDateParser {


    getStartDate(assignment: AssignmentDAO): moment.Moment {
        return moment(assignment.start).tz("Europe/Berlin");
    }

}

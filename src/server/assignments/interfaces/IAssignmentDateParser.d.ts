import * as moment from 'moment';
import { AssignmentDAO } from '../../../collections/lib/AssignmentsCollection';

export interface IAssignmentDateParser {
  getStartDate(assignment: AssignmentDAO): moment.Moment;
}

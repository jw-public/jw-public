import { AssignmentDAO } from "../../../collections/lib/AssignmentsCollection";

export interface IAssignmentDateParser {
  getStartDate(assignment: Pick<AssignmentDAO, "start">): moment.Moment;
}

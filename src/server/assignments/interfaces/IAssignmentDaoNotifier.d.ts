import { AssignmentDAO } from "../../../collections/lib/AssignmentsCollection";
import { IAssignmentNotifierOptions } from "./IAssignmentNotifier";

export interface IAssignmentMultiNotifierOptions extends IAssignmentNotifierOptions {
  assignment: AssignmentDAO
}

export interface IAssignmentDaoNotifier {

  notifyUsersOfAssignment(options: IAssignmentMultiNotifierOptions);
  notifyParticipantsOfAssignment(options: IAssignmentMultiNotifierOptions);
  notifyApplicantsOfAssignment(options: IAssignmentMultiNotifierOptions);

}

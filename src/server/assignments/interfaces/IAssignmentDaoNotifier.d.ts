import {IAssignmentNotifierOptions} from "./IAssignmentNotifier";
import {AssignmentDAO} from "../../../collections/lib/AssignmentsCollection";

export interface IAssignmentMultiNotifierOptions extends IAssignmentNotifierOptions {
  assignment: AssignmentDAO
}

export interface IAssignmentDaoNotifier {

  notifyUsersOfAssignment(options: IAssignmentMultiNotifierOptions);
  notifyParticipantsOfAssignment(options: IAssignmentMultiNotifierOptions);
  notifyApplicantsOfAssignment(options: IAssignmentMultiNotifierOptions);

}

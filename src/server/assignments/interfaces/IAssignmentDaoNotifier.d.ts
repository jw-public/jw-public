import { AssignmentDAO } from "../../../collections/lib/AssignmentsCollection";
import { IAssignmentNotifierOptions } from "./IAssignmentNotifier";

export interface IAssignmentMultiNotifierOptions extends IAssignmentNotifierOptions {
  assignment: AssignmentDAO
}

export interface IAssignmentDaoNotifier {

  notifyUsersOfAssignment(options: IAssignmentMultiNotifierOptions): Promise<void>;
  notifyParticipantsOfAssignment(options: IAssignmentMultiNotifierOptions): Promise<void>;
  notifyApplicantsOfAssignment(options: IAssignmentMultiNotifierOptions): Promise<void>;

}

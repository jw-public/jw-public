import { IAssignmentParticipantController } from "./IAssignmentParticipantController";

/**
* I provide you with a fresh instance of an IAssignmentParticipantController.
*/
export interface IAssignmentParticipantControllerFactory extends Function {
  (assignmentId: string): IAssignmentParticipantController
}

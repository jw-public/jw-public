import {IAssignmentApplicationController} from "./IAssignmentApplicationController";

/**
* I provide you with a fresh instance of an IAssignmentApplicationController.
*/
export interface IAssignmentApplicationControllerFactory extends Function {
  (assignmentId: string): IAssignmentApplicationController
}

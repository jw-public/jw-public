import {AssignmentEventType} from "../../../imports/assignments/interfaces/AssignmentEventType";

export interface IAssignmentNotifierOptions {
    eventType: AssignmentEventType,
    reenablingReason?: string
}

export interface IAssignmentSingleNotifierOptions extends IAssignmentNotifierOptions{
    userId: string,
    assignmentId: string
}




/**
* I am a notifier, which notifies user, when something at a assignment happens.
*/
export interface IAssignmentNotifier {

  /**
  * Notifies given user about their acceptance to the assignment.
  */
  notifyUserAboutAssignment(options: IAssignmentSingleNotifierOptions);

}

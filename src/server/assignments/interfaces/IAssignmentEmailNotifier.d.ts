import {IAssignmentSingleNotifierOptions} from "./IAssignmentNotifier";

/**
* I am a notifier, which notifies user via email, when something at a assignment happens.
*/
export interface IAssignmentEmailNotifier {

  /**
  * Notifies given user about their acceptance to the assignment via email.
  */
  notifyUserAboutAssignmentViaEmail(options: IAssignmentSingleNotifierOptions);

}

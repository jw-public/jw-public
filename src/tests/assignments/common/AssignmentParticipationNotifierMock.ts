import { assert } from "chai";
import { injectable } from "inversify";
import { IAssignmentContext } from "../../../server/assignments/interfaces/IAssignmentContext";
import { IAssignmentNotifierOptions, IAssignmentParticipationNotifier } from "../../../server/assignments/interfaces/IAssignmentParticipationNotifier";

@injectable()
export class AssignmentParticipationNotifierMock implements IAssignmentParticipationNotifier {

  public lastAcceptanceNotificationOptions: IAssignmentNotifierOptions = null;
  public lastRemovalNotificationOptions: IAssignmentNotifierOptions = null;

  constructor(private assignmentContext: IAssignmentContext) {

  }

  notifyUsersAreAccepted(options: IAssignmentNotifierOptions) {
    this.lastAcceptanceNotificationOptions = options;
  }

  notifyUsersAreNotAccepted(options: IAssignmentNotifierOptions) {
    this.lastRemovalNotificationOptions = options;
  }

  assertUserWasNotifiedAboutAccepted(userId: string) {
    assert.deepEqual({
      userIds: [userId],
      assignmentId: this.assignmentContext.getAssignmentId()
    }, this.lastAcceptanceNotificationOptions);
  }

  assertNoUserWasNotifiedAboutAccepted() {
    assert.isNull(this.lastAcceptanceNotificationOptions, "No user should have been notified about acceptance");
  }

  assertNoUserWasNotifiedAboutRemoved() {
    assert.isNull(this.lastRemovalNotificationOptions, "No user should have been notified about removal");
  }




  assertUserWasNotifiedAboutRemoval(userId: string) {
    assert.deepEqual({
      userIds: [userId],
      assignmentId: this.assignmentContext.getAssignmentId()
    }, this.lastRemovalNotificationOptions);
  }

}

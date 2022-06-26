import { assert } from "chai";
import { NotificationDAO } from "../../collections/lib/classes/UserNotification";
import { SimpleCollection } from "../../imports/interfaces/SimpleCollection";




export class NotificationsAsserts {
  constructor(private collection: SimpleCollection<NotificationDAO>, private testUser: string) {

  }

  public assignmentNotificationCountIs(expected: number): void {
    let notifcationCount = this.collection.find({
      type: "Assignment"
    }).count();
    let assertMessage = `Total sum of notifcations is ${notifcationCount}, but expected was ${expected}.`;

    assert.strictEqual(notifcationCount, expected, assertMessage);
  }

  public thereIsOneNotificationForTestUser(): NotificationAsserts {
    return this.thereIsOneNotificationFor(this.testUser);
  }

  public thereIsOneNotificationFor(userId: string): NotificationAsserts {

    let query = {
      type: "Assignment",
      userId: userId
    };

    let notificationCursor = this.collection.find(query);
    let notifcationCountForUser = notificationCursor.count();
    let expected = 1;
    let assertMessage = `Total sum of notifcations is ${notifcationCountForUser}, but expected was ${expected}.`;

    assert.strictEqual(notifcationCountForUser, expected, assertMessage);
    return new NotificationAsserts(this.collection.findOne(query));
  }

  public notificationCountForAssignmentIs(options: { assignmentId: string, expectedCount: number }): any {
    let notifcationCountForAssignment = this.collection.find({
      type: "Assignment",
      "assignmentOptions.id": options.assignmentId
    }).count();

    let expected = options.expectedCount;

    let assertMessage = `Total sum of notifcations for assignment "${options.assignmentId}" is ${notifcationCountForAssignment}, but expected was ${expected}.`;

    assert.strictEqual(notifcationCountForAssignment, expected, assertMessage);
  }

}

class NotificationAsserts {

  constructor(private notification: NotificationDAO) {
  }

  hasAssignmentEventType(eventType: string) {
    this.optionFieldEqualsValue("type", eventType);
  }

  hasReenablingReason(value: string) {
    this.optionFieldEqualsValue("reenablingReason", value);
  }

  optionFieldEqualsValue(field: string, value: any) {
    assert.equal(this.notification.assignmentOptions[field], value);
  }

}

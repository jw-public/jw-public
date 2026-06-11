import { assert } from "chai";
import * as TypeMoq from "typemoq";
import { NotificationDAO } from "../../collections/lib/classes/UserNotification";
import { AssignmentEventType } from "../../imports/assignments/interfaces/AssignmentEventType";
import { SimpleCollection } from "../../imports/interfaces/SimpleCollection";
import { AssignmentNotifier } from "../../server/assignments/classes/AssignmentNotifier";
import {
  IAssignmentNotifier,
  IAssignmentSingleNotifierOptions,
} from "../../server/assignments/interfaces/IAssignmentNotifier";
import { IAssignmentParticipationNotifier } from "../../server/assignments/interfaces/IAssignmentParticipationNotifier";
import { buildServices } from "../../server/services";
import { AssignmentCopyActionDAO } from "../../collections/lib/AssignmentCopyActionsCollection";
import { AssignmentDAO } from "../../collections/lib/AssignmentsCollection";
import { LocalCollection } from "../3rdParty/minimongo-standalone/minimongo-standalone";
import { NotificationsAsserts } from "../common/NotificationsAsserts";
import { NullEmailSender } from "../common/NullEmailSender";

describe("AssignmentParticipationNotifier", async function () {
  it("should not be null or undefined", async function () {
    // Arrange
    let testCase = new AssignmentNotifierTestCase();

    // Act

    // Assert
    assert.isDefined(testCase.notifier);
    assert.isNotNull(testCase.notifier);
  });

  it("notifyUsersAreAccepted should call notifier correctly", async function () {
    // Arrange
    let testCase = new AssignmentNotifierTestCase();

    // Act
    await testCase.notifier.notifyUsersAreAccepted({
      userIds: [testCase.testUser, "someOtherGuy"],
      assignmentId: "randomAssignmentId",
    });
    // Assert

    testCase.expectNotificationWith({
      userId: testCase.testUser,
      eventType: AssignmentEventType.Accept,
      assignmentId: "randomAssignmentId",
    });

    testCase.expectNotificationWith({
      userId: "someOtherGuy",
      eventType: AssignmentEventType.Accept,
      assignmentId: "randomAssignmentId",
    });
  });

  it("notifyUsersAreNotAccepted should call notifier correctly", async function () {
    // Arrange
    let testCase = new AssignmentNotifierTestCase();

    // Act
    await testCase.notifier.notifyUsersAreNotAccepted({
      userIds: [testCase.testUser, "someOtherGuy"],
      assignmentId: "randomAssignmentId",
    });
    // Assert
    testCase.expectNotificationWith({
      userId: testCase.testUser,
      eventType: AssignmentEventType.Removed,
      assignmentId: "randomAssignmentId",
    });

    testCase.expectNotificationWith({
      userId: "someOtherGuy",
      eventType: AssignmentEventType.Removed,
      assignmentId: "randomAssignmentId",
    });
  });
});

const testData = {
  userId: "randomUserId",
};

class AssignmentNotifierTestCase {
  private collection: SimpleCollection<NotificationDAO>;
  private _notifier: IAssignmentParticipationNotifier | null = null;
  private _assignmentNotifierMock: TypeMoq.Mock<IAssignmentNotifier>;

  constructor() {
    this.collection = new LocalCollection<NotificationDAO>("test-notification");

    this._assignmentNotifierMock = TypeMoq.Mock.ofType<IAssignmentNotifier>(AssignmentNotifier);

    const services = buildServices(
      {
        assignments: new LocalCollection<AssignmentDAO>("assignment"),
        assignmentCopyActions: new LocalCollection<AssignmentCopyActionDAO>("test-copy-actions"),
        notifications: this.collection,
        users: new LocalCollection("user"),
        groups: new LocalCollection("group"),
      },
      new NullEmailSender(),
      { assignmentNotifier: this._assignmentNotifierMock.object },
    );
    this._notifier = services.participationNotifier;
  }

  expectNotificationWith(expectedOptions: IAssignmentSingleNotifierOptions) {
    this.notifierMock.verify(
      (x) => x.notifyUserAboutAssignment(TypeMoq.It.isValue(expectedOptions)),
      TypeMoq.Times.once(),
    );
  }

  get notifier() {
    return this._notifier!;
  }

  get assert() {
    return new NotificationsAsserts(this.collection, this.testUser);
  }

  get testUser() {
    return testData.userId;
  }

  get notifierMock() {
    return this._assignmentNotifierMock;
  }
}

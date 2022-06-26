import { assert, expect } from 'chai';
import * as TypeMoq from 'typemoq';
import { AssignmentEventType } from '../../imports/assignments/interfaces/AssignmentEventType';
import { AssignmentServiceTypes } from '../../server/assignments/AssignmentServiceTypes';
import { AssignmentEmailNotifier } from '../../server/assignments/classes/AssignmentEmailNotifier';
import { IAssignmentEmailNotifier } from '../../server/assignments/interfaces/IAssignmentEmailNotifier';
import {
  IAssignmentNotifier,
  IAssignmentSingleNotifierOptions
} from '../../server/assignments/interfaces/IAssignmentNotifier';
import { TestCase } from '../common/TestCase';







describe("AssignmentNotifier", function () {

  it("should not be null or undefined", function () {
    // Arrange
    let testCase = new AssignmentNotifierTestCase();

    // Act

    // Assert
    assert.isDefined(testCase.notifier);
    assert.isNotNull(testCase.notifier);
  });

  it("should add a notification for given user", function () {
    // Arrange
    let testCase = new AssignmentNotifierTestCase();

    // Act
    testCase.notifier.notifyUserAboutAssignment({
      userId: testCase.testUserId,
      assignmentId: "randomAssignmentId",
      eventType: AssignmentEventType.Accept
    });
    // Assert
    testCase.notificationAssert.assignmentNotificationCountIs(1);
    testCase.notificationAssert.thereIsOneNotificationForTestUser();

  });

  it("should add send notification via email", function () {
    // Arrange
    let testCase = new AssignmentNotifierTestCase();

    // Act
    testCase.notifier.notifyUserAboutAssignment({
      userId: testCase.testUserId,
      assignmentId: "randomAssignmentId",
      eventType: AssignmentEventType.Accept
    });
    // Assert
    testCase.emailAssert.emailWasSentWith({
      userId: testCase.testUserId,
      assignmentId: "randomAssignmentId",
      eventType: AssignmentEventType.Accept
    });
  });


  it("should add a reenabling notification for given user", function () {
    // Arrange
    let testCase = new AssignmentNotifierTestCase();

    // Act
    testCase.notifier.notifyUserAboutAssignment({
      userId: testCase.testUserId,
      assignmentId: "randomAssignmentId",
      eventType: AssignmentEventType.Reenable,
      reenablingReason: "Test Reason"
    });
    // Assert
    testCase.notificationAssert.thereIsOneNotificationForTestUser().hasAssignmentEventType("Reenable");
    testCase.notificationAssert.thereIsOneNotificationForTestUser().hasReenablingReason("Test Reason");
  });

  it("should throw error if reenabling notification without reason", function () {
    // Arrange
    let testCase = new AssignmentNotifierTestCase();

    // Act
    let functionCall = () => {
      testCase.notifier.notifyUserAboutAssignment({
        userId: testCase.testUserId,
        assignmentId: "randomAssignmentId",
        eventType: AssignmentEventType.Reenable,
      });
    };

    // Assert
    expect(functionCall).to.throw(Error, "Reenabling notification needs a reason.");
    testCase.notificationAssert.assignmentNotificationCountIs(0);

  });

  it("should map correct event types", function () {

    let testForMapping = (enumValue: AssignmentEventType, expectedString: string) => {
      // Arrange
      let testCase = new AssignmentNotifierTestCase();
      // Act
      testCase.notifier.notifyUserAboutAssignment({
        userId: testCase.testUserId,
        assignmentId: "randomAssignmentId",
        eventType: enumValue
      });
      // Assert
      testCase.notificationAssert.thereIsOneNotificationForTestUser().hasAssignmentEventType(expectedString);
    };


    testForMapping(AssignmentEventType.Accept, "Accept");
    testForMapping(AssignmentEventType.Removed, "Removed");
    testForMapping(AssignmentEventType.Cancel, "Cancel");

  });

  it("should link to correct assignment", function () {

    // Arrange
    let testCase = new AssignmentNotifierTestCase();

    // Act
    testCase.notifier.notifyUserAboutAssignment({
      userId: testCase.testUserId,
      assignmentId: "randomAssignmentId",
      eventType: AssignmentEventType.Accept
    });
    // Assert
    testCase.notificationAssert.notificationCountForAssignmentIs({
      assignmentId: "randomAssignmentId",
      expectedCount: 1
    });
  });


});





class AssignmentNotifierTestCase extends TestCase<IAssignmentNotifier> {
  public _userMailerMock: TypeMoq.Mock<IAssignmentEmailNotifier>;

  constructor() {
    super(AssignmentServiceTypes.IAssignmentNotifier);

    this._userMailerMock = TypeMoq.Mock.ofType<IAssignmentEmailNotifier>(AssignmentEmailNotifier);

    this.replaceWithMock<IAssignmentEmailNotifier>(
      {
        type: AssignmentServiceTypes.IAssignmentEmailNotifier,
        mock: this._userMailerMock
      });
  }

  public get emailAssert() {
    return {
      noEmailWasSent: () => {
        this._userMailerMock.verify(emailSender => emailSender.notifyUserAboutAssignmentViaEmail(TypeMoq.It.isAny()), TypeMoq.Times.never());
      },
      oneEmailWasSent: () => {
        this._userMailerMock.verify(emailSender => emailSender.notifyUserAboutAssignmentViaEmail(TypeMoq.It.isAny()), TypeMoq.Times.once());
      },
      emailWasSentWith: (options: IAssignmentSingleNotifierOptions) => {
        this._userMailerMock.verify(emailSender => emailSender.notifyUserAboutAssignmentViaEmail(TypeMoq.It.isValue(options)), TypeMoq.Times.once());
      }
    }
  }

  get notifier() {
    return this.getTestObject();
  }



}

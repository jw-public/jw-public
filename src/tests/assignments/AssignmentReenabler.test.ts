import { Types } from "../../server/Types";

import { AssignmentEventType } from "../../imports/assignments/interfaces/AssignmentEventType";
import { AssignmentTestCaseWithNotifications } from "./common/AssignmentTestCaseWithNotifications";

import { assert } from "chai";

import { IAssignmentReenabler } from "../../server/assignments/interfaces/IAssignmentReenabler";

describe("AssignmentReenabler", function () {

  it("should not be null or undefined", function () {
    // Arrange
    let testCase = new AssignmentReenablerTestCase();

    // Act

    // Assert
    assert.isDefined(testCase.reenabler);
    assert.isNotNull(testCase.reenabler);
  });


  it("should set state to Closed by default", function () {
    // Arrange
    let testCase = new AssignmentReenablerTestCase();
    let toBeReenabledId = testCase.collection.insert({
      name: "To be reenabled",
      state: "Canceled"
    });

    // Act
    testCase.reenabler.reenableAssignment(toBeReenabledId, "I don't know");

    // Assert
    let actualAssignment = testCase.collection.findOne();
    assert.equal(actualAssignment.state, "Closed", "Did not reenable the assignment.");
  });

  it("should restore valid state before cancelment", function () {
    // Arrange
    let testCase = new AssignmentReenablerTestCase();
    let toBeReenabledId = testCase.collection.insert({
      name: "To be reenabled",
      state: "Canceled",
      stateBeforeLastClose: "Closed"
    });

    // Act
    testCase.reenabler.reenableAssignment(toBeReenabledId, "I don't know");

    // Assert
    let actualAssignment = testCase.collection.findOne();
    assert.equal(actualAssignment.state, "Closed", "Did not reenable the assignment with desired state.");
  });

  it("should not restore invalid state before cancelment", function () {
    // Arrange
    let testCase = new AssignmentReenablerTestCase();
    let toBeReenabledId = testCase.collection.insert({
      name: "To be reenabled",
      state: "Canceled",
      stateBeforeLastClose: "SomeInvalidStateBla"
    });

    // Act
    testCase.reenabler.reenableAssignment(toBeReenabledId, "I don't know");

    // Assert
    let actualAssignment = testCase.collection.findOne();
    assert.equal(actualAssignment.state, "Closed", "Did not reenable the assignment with desired state.");
  });

  it("should notify participants", function () {
    // Arrange
    let testCase = new AssignmentReenablerTestCase();
    let toBeReenabledId = testCase.collection.insert({
      name: "To be reenabled",
      state: "Canceled",
      participants: [{
        user: "pleaseNotifyMe"
      }, {
        user: "meToo"
      }]
    });

    // Act
    testCase.reenabler.reenableAssignment(toBeReenabledId, "I don't know");

    // Assert
    testCase.expectAmountOfNotificationsIs(2);

    testCase.expectNotificationWith({
      userId: "pleaseNotifyMe",
      eventType: AssignmentEventType.Reenable,
      reenablingReason: "I don't know",
      assignmentId: toBeReenabledId
    });
    testCase.expectNotificationWith({
      userId: "meToo",
      eventType: AssignmentEventType.Reenable,
      reenablingReason: "I don't know",
      assignmentId: toBeReenabledId
    });
  });

  it("should not notify applicants", function () {
    // Arrange
    let testCase = new AssignmentReenablerTestCase();
    let toBeReenabledId = testCase.collection.insert({
      name: "To be reenabled",
      state: "Canceled",
      applicants: [{
        user: "pleaseDontNotifyMe"
      }, {
        user: "meToo"
      }]
    });

    // Act
    testCase.reenabler.reenableAssignment(toBeReenabledId, "I don't know");

    // Assert
    testCase.expectAmountOfNotificationsIs(0);

  });

});


class AssignmentReenablerTestCase extends AssignmentTestCaseWithNotifications<IAssignmentReenabler> {
  private _reenabler: IAssignmentReenabler = null;

  constructor() {
    super(Types.IAssignmentReenabler);
    this._reenabler = this.getTestObject();
  }

  get reenabler(): IAssignmentReenabler {
    return this._reenabler;
  }

}

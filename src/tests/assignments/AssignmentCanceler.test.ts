import { Types } from "../../server/Types";

import { AssignmentEventType } from "../../imports/assignments/interfaces/AssignmentEventType";
import { AssignmentTestCaseWithNotifications } from "./common/AssignmentTestCaseWithNotifications";

import { assert } from "chai";

import { IAssignmentCanceler } from "../../server/assignments/interfaces/IAssignmentCanceler";

describe("AssignmentCanceler", function () {

    it("should not be null or undefined", function () {
        // Arrange
        let testCase = new AssignmentCancelerTestCase();

        // Act

        // Assert
        assert.isDefined(testCase.canceler);
        assert.isNotNull(testCase.canceler);
    });

    it("should cancel assignment", function () {
        // Arrange
        let testCase = new AssignmentCancelerTestCase();
        let toBeCanceledId = testCase.collection.insert({
            name: "To be canceled",
            state: "Online"
        });

        // Act
        testCase.canceler.cancelAssignment(toBeCanceledId, "I don't know");

        // Assert
        let actualAssignment = testCase.collection.findOne();
        assert.equal(actualAssignment.state, "Canceled", "Did not cancel the assignment.");
        assert.equal(actualAssignment.cancelationReason, "I don't know", "Did not set the reason field of the assignment.");
        assert.equal(actualAssignment.stateBeforeLastClose, "Online", "Did not set field stateBeforeLastClose correctly.");
    });


    it("should notify participants", function () {
        // Arrange
        let testCase = new AssignmentCancelerTestCase();
        let toBeCanceledId = testCase.collection.insert({
            name: "To be canceled",
            participants: [{
                user: "pleaseNotifyMe"
            }, {
                user: "meToo"
            }]
        });

        // Act
        testCase.canceler.cancelAssignment(toBeCanceledId, "I don't know");

        // Assert
        testCase.expectNotificationWith({
            userId: "pleaseNotifyMe",
            eventType: AssignmentEventType.Cancel,
            assignmentId: toBeCanceledId
        });

        testCase.expectNotificationWith({
            userId: "meToo",
            eventType: AssignmentEventType.Cancel,
            assignmentId: toBeCanceledId
        });
    });

    it("should not notify applicants", function () {
        // Arrange
        let testCase = new AssignmentCancelerTestCase();
        let toBeCanceledId = testCase.collection.insert({
            name: "To be deleted",
            applicants: [
                {
                    user: "pleaseNotifyMe"
                }, {
                    user: "meToo"
                }]
        });

        // Act
        testCase.canceler.cancelAssignment(toBeCanceledId, "I don't know");

        // Assert

        testCase.expectNoNotifications();
    });


});


class AssignmentCancelerTestCase extends AssignmentTestCaseWithNotifications<IAssignmentCanceler> {
    private _canceler: IAssignmentCanceler = null;

    constructor() {
        super(Types.IAssignmentCanceler);
        this._canceler = this.getTestObject();
    }

    get canceler(): IAssignmentCanceler {
        return this._canceler;
    }

}

import { Types } from "../../server/Types";

import { AssignmentEventType } from "../../imports/assignments/interfaces/AssignmentEventType";
import { AssignmentTestCaseWithNotifications } from "./common/AssignmentTestCaseWithNotifications";

import { assert } from "chai";

import { IAssignmentRemover } from "../../server/assignments/interfaces/IAssignmentRemover";

describe("AssignmentRemover", function () {

    it("should not be null or undefined", function () {
        // Arrange
        let testCase = new AssignmentRemoverTestCase();

        // Act

        // Assert
        assert.isDefined(testCase.remover);
        assert.isNotNull(testCase.remover);
    });

    it("should remove assignment", function () {
        // Arrange
        let testCase = new AssignmentRemoverTestCase();
        let toBeDeletedId = testCase.collection.insert({
            name: "To be deleted"
        });

        let notToBeDeletedId = testCase.collection.insert({
            name: "NOT to be deleted"
        });

        // Act
        testCase.remover.removeAssignment(toBeDeletedId);

        // Assert
        assert.equal(testCase.collection.find().count(), 1, "Did not remove assignment correctly.");
        assert.equal(testCase.collection.findOne().name, "NOT to be deleted", "Did remove the wrong one.");
    });

    it("should notify participants", function () {
        // Arrange
        let testCase = new AssignmentRemoverTestCase();
        let toBeDeletedId = testCase.collection.insert({
            name: "To be deleted",
            participants: [{
                user: "pleaseNotifyMe"
            }, {
                user: "meToo"
            }]
        });

        // Act
        testCase.remover.removeAssignment(toBeDeletedId);

        // Assert
        assert.equal(testCase.collection.find().count(), 0, "Did not remove assignment correctly.");

        testCase.expectNotificationWith({
            userId: "pleaseNotifyMe",
            eventType: AssignmentEventType.Removed,
            assignmentId: toBeDeletedId
        });

        testCase.expectNotificationWith({
            userId: "meToo",
            eventType: AssignmentEventType.Removed,
            assignmentId: toBeDeletedId
        });
    });

    it("should notify applicants", function () {
        // Arrange
        let testCase = new AssignmentRemoverTestCase();
        let toBeDeletedId = testCase.collection.insert({
            name: "To be deleted",
            applicants: [{
                user: "pleaseNotifyMe"
            }, {
                user: "meToo"
            }]
        });

        // Act
        testCase.remover.removeAssignment(toBeDeletedId);

        // Assert
        assert.equal(testCase.collection.find().count(), 0, "Did not remove assignment correctly.");

        testCase.expectNotificationWith({
            userId: "pleaseNotifyMe",
            eventType: AssignmentEventType.Removed,
            assignmentId: toBeDeletedId
        });

        testCase.expectNotificationWith({
            userId: "meToo",
            eventType: AssignmentEventType.Removed,
            assignmentId: toBeDeletedId
        });
    });


});


class AssignmentRemoverTestCase extends AssignmentTestCaseWithNotifications<IAssignmentRemover> {
    private _remover: IAssignmentRemover = null;

    constructor() {
        super(Types.IAssignmentRemover);
        this._remover = this.getTestObject();
    }

    get remover(): IAssignmentRemover {
        return this._remover;
    }


}

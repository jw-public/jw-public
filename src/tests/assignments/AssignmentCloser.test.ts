import { AssignmentEventType } from '../../imports/assignments/interfaces/AssignmentEventType';
import { IAssignmentCloser } from '../../server/assignments/interfaces/IAssignmentCloser';
import { Types } from '../../server/Types';
import { AssignmentTestCaseWithNotifications } from './common/AssignmentTestCaseWithNotifications';
import { assert } from 'chai';





describe("AssignmentCloser", function () {

    it("should not be null or undefined", function () {
        // Arrange
        let testCase = new AssignmentCloserTestCase();

        // Act

        // Assert
        assert.isDefined(testCase.closer);
        assert.isNotNull(testCase.closer);
    });

    it("should update database entry correctly", function () {
        // Arrange
        let testCase = new AssignmentCloserTestCase();
        let toBeClosedId = testCase.collection.insert({
            name: "To be closed",
            state: "Online"
        });

        let notToBeClosedId = testCase.collection.insert({
            name: "NOT to be closed",
            state: "Online"
        });
        // Act

        testCase.closer.closeAssignment({
            assignmentId: toBeClosedId,
            participantIds: []
        });

        // Assert
        let toBeClosedAssignment = testCase.collection.findOne({ _id: toBeClosedId });
        let notToBeClosedAssignment = testCase.collection.findOne({ _id: notToBeClosedId });

        assert.equal(toBeClosedAssignment.state, "Closed", "Did not close assignment");
        assert.equal(notToBeClosedAssignment.state, "Online", "Should not close other assignments");
    });


    it("should set participants correctly", function () {
        // Arrange
        let testCase = new AssignmentCloserTestCase();
        let toBeClosedId = testCase.collection.insert({
            name: "To be closed",
            state: "Online",
            applicants: [
                { user: "user1" },
                { user: "user2" },
            ],
            participants: [{ user: "user3" }, { user: "user5" }]
        });

        // Act

        testCase.closer.closeAssignment({
            assignmentId: toBeClosedId,
            participantIds: ["user3", "user2"]
        });

        // Assert
        let toBeClosedAssignment = testCase.collection.findOne({ _id: toBeClosedId });

        testCase.assert(toBeClosedAssignment).participantCountIs(2);
        testCase.assert(toBeClosedAssignment).applicantCountIs(0);
        testCase.assert(toBeClosedAssignment).containsUserIdInParticipants("user3");
        testCase.assert(toBeClosedAssignment).containsUserIdInParticipants("user2");
    });

    it("should notify new participants", function () {
        // Arrange
        let testCase = new AssignmentCloserTestCase();
        let toBeClosedId = testCase.collection.insert({
            name: "To be closed",
            state: "Online",
            participants: [
                { user: "user1" }
            ],
            applicants: []
        });

        // Act

        testCase.closer.closeAssignment({
            assignmentId: toBeClosedId,
            participantIds: ["user3", "user2", "user1"]
        });

        // Assert
        let toBeClosedAssignment = testCase.collection.findOne({ _id: toBeClosedId });

        testCase.expectNotificationWith({
            userId: "user2",
            assignmentId: toBeClosedId,
            eventType: AssignmentEventType.Accept
        });
        testCase.expectNotificationWith({
            userId: "user3",
            assignmentId: toBeClosedId,
            eventType: AssignmentEventType.Accept
        });
    });

    it("should notify removed applicants and remaining participants", function () {
        // Arrange
        let testCase = new AssignmentCloserTestCase();
        let toBeClosedId = testCase.collection.insert({
            name: "To be closed",
            state: "Online",
            applicants: [
                { user: "user1" }, { user: "user2" }
            ],
            participants: [
                { user: "user5" },
                { user: "user3" },
                { user: "user6" }
            ],
        });

        // Act
        testCase.closer.closeAssignment({
            assignmentId: toBeClosedId,
            participantIds: ["user3", "user2"]
        });

        // Assert
        let toBeClosedAssignment = testCase.collection.findOne({ _id: toBeClosedId });
        testCase.expectAmountOfNotificationsIs(5);
        testCase.expectNotificationWith({
            userId: "user1",
            assignmentId: toBeClosedId,
            eventType: AssignmentEventType.Removed
        });
        testCase.expectNotificationWith({
            userId: "user2",
            assignmentId: toBeClosedId,
            eventType: AssignmentEventType.Accept
        });
        testCase.expectNotificationWith({
            userId: "user5",
            assignmentId: toBeClosedId,
            eventType: AssignmentEventType.Removed
        });
        testCase.expectNotificationWith({
            userId: "user6",
            assignmentId: toBeClosedId,
            eventType: AssignmentEventType.Removed
        });
        testCase.expectNotificationWith({
            userId: "user3",
            assignmentId: toBeClosedId,
            eventType: AssignmentEventType.Modified
        });
    });

    it("should notify remaining participants if user gets removed", function () {
        // Arrange
        let testCase = new AssignmentCloserTestCase();
        let toBeClosedId = testCase.collection.insert({
            name: "To be closed",
            state: "Online",
            applicants: [],
            participants: [
                { user: "user5" },
                { user: "user3" }
            ],
        });

        // Act
        testCase.closer.closeAssignment({
            assignmentId: toBeClosedId,
            participantIds: ["user3"]
        });

        // Assert
        testCase.expectNotificationWith({
            userId: "user3",
            assignmentId: toBeClosedId,
            eventType: AssignmentEventType.Modified
        });
    });


    it("should not notify participants if nothing changes", function () {
        // Arrange
        let testCase = new AssignmentCloserTestCase();
        let toBeClosedId = testCase.collection.insert({
            name: "To be closed",
            state: "Online",
            applicants: [],
            participants: [
                { user: "user5" },
                { user: "user3" }
            ],
        });

        // Act
        testCase.closer.closeAssignment({
            assignmentId: toBeClosedId,
            participantIds: ["user3", "user5"]
        });

        // Assert
        let toBeClosedAssignment = testCase.collection.findOne({ _id: toBeClosedId });
        testCase.expectAmountOfNotificationsIs(0);

    });

});


class AssignmentCloserTestCase extends AssignmentTestCaseWithNotifications<IAssignmentCloser> {
    private _closer: IAssignmentCloser = null;

    constructor() {
        super(Types.IAssignmentCloser);
        this._closer = this.getTestObject();
    }

    get closer(): IAssignmentCloser {
        return this._closer;
    }

}

import { assert } from 'chai';
import { interfaces, Kernel } from 'inversify';
import * as TypeMoq from 'typemoq';
import { NotificationDAO } from '../../collections/lib/classes/UserNotification';
import { AssignmentEventType } from '../../imports/assignments/interfaces/AssignmentEventType';
import { SimpleCollection } from '../../imports/interfaces/SimpleCollection';
import { AssignmentServiceTypes } from '../../server/assignments/AssignmentServiceTypes';
import { AssignmentNotifier } from '../../server/assignments/classes/AssignmentNotifier';
import {
    IAssignmentNotifier,
    IAssignmentSingleNotifierOptions
} from '../../server/assignments/interfaces/IAssignmentNotifier';
import {
    IAssignmentParticipationNotifier
} from '../../server/assignments/interfaces/IAssignmentParticipationNotifier';
import { kernelModule } from '../../server/assignments/KernelModule';
import { Types } from '../../server/Types';
import { LocalCollection } from '../3rdParty/minimongo-standalone/minimongo-standalone';
import { NotificationsAsserts } from '../common/NotificationsAsserts';



describe("AssignmentParticipationNotifier", function () {

    it("should not be null or undefined", function () {
        // Arrange
        let testCase = new AssignmentNotifierTestCase();

        // Act

        // Assert
        assert.isDefined(testCase.notifier);
        assert.isNotNull(testCase.notifier);
    });

    it("notifyUsersAreAccepted should call notifier correctly", function () {
        // Arrange
        let testCase = new AssignmentNotifierTestCase();


        // Act
        testCase.notifier.notifyUsersAreAccepted({
            userIds: [testCase.testUser, "someOtherGuy"],
            assignmentId: "randomAssignmentId"
        });
        // Assert

        testCase.expectNotificationWith({
            userId: testCase.testUser,
            eventType: AssignmentEventType.Accept,
            assignmentId: "randomAssignmentId"
        });

        testCase.expectNotificationWith({
            userId: "someOtherGuy",
            eventType: AssignmentEventType.Accept,
            assignmentId: "randomAssignmentId"
        });

    });

    it("notifyUsersAreNotAccepted should call notifier correctly", function () {
        // Arrange
        let testCase = new AssignmentNotifierTestCase();

        // Act
        testCase.notifier.notifyUsersAreNotAccepted({
            userIds: [testCase.testUser, "someOtherGuy"],
            assignmentId: "randomAssignmentId"
        });
        // Assert
        testCase.expectNotificationWith({
            userId: testCase.testUser,
            eventType: AssignmentEventType.Removed,
            assignmentId: "randomAssignmentId"
        });

        testCase.expectNotificationWith({
            userId: "someOtherGuy",
            eventType: AssignmentEventType.Removed,
            assignmentId: "randomAssignmentId"
        });
    });


});


const testData = {
    userId: "randomUserId",
};




class AssignmentNotifierTestCase {
    private collection: SimpleCollection<NotificationDAO>;
    private kernel: interfaces.Kernel;
    private _notifier: IAssignmentParticipationNotifier = null;
    private _assignmentNotifierMock: TypeMoq.Mock<IAssignmentNotifier>;

    constructor() {
        this.kernel = new Kernel();
        this.kernel.load(kernelModule);
        this.collection = new LocalCollection<NotificationDAO>("test-notification");

        this._assignmentNotifierMock = TypeMoq.Mock.ofType<IAssignmentNotifier>(AssignmentNotifier);

        this.kernel.unbind(AssignmentServiceTypes.IAssignmentNotifier);
        this.kernel.bind<IAssignmentNotifier>(AssignmentServiceTypes.IAssignmentNotifier).toConstantValue(this._assignmentNotifierMock.object);

        this.kernel.bind<SimpleCollection<NotificationDAO>>(Types.Collection).toConstantValue(this.collection).whenTargetNamed("notification");

        this._notifier = this.kernel.get<IAssignmentParticipationNotifier>(AssignmentServiceTypes.IAssignmentParticipationNotifier);

    }

    expectNotificationWith(expectedOptions: IAssignmentSingleNotifierOptions) {
        this.notifierMock
            .verify(x => x.notifyUserAboutAssignment(TypeMoq.It.isValue(expectedOptions)), TypeMoq.Times.once());
    }


    get notifier() {
        return this._notifier;
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

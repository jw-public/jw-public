
import { AssignmentNotifier } from "../../../server/assignments/classes/AssignmentNotifier";
import { IAssignmentNotifier, IAssignmentSingleNotifierOptions } from "../../../server/assignments/interfaces/IAssignmentNotifier";

import { Types } from "../../../server/Types";


import { SimpleCollection } from "../../../imports/interfaces/SimpleCollection";
import { LocalCollection } from "../../3rdParty/minimongo-standalone/minimongo-standalone";

import { AssignmentDAO } from "../../../collections/lib/AssignmentsCollection";
import { NotificationDAO } from "../../../collections/lib/classes/UserNotification";

import * as TypeMoq from "typemoq";

import { interfaces, Kernel } from "inversify";
import { AssignmentServiceTypes } from "../../../server/assignments/AssignmentServiceTypes";
import { kernelModule as assignmentKernelModule } from "../../../server/assignments/KernelModule";
import { kernelModule as loggingKernelModule } from "../../../server/logging/KernelModule";
import { AssignmentAsserts } from "./AssignmentAsserts";



const testData = {
    userId: "randomUserId",
};




export class AssignmentTestCaseWithNotifications<T> {
    public collection: SimpleCollection<AssignmentDAO>;
    protected kernel: interfaces.Kernel;
    private _assignmentNotifierMock: TypeMoq.Mock<IAssignmentNotifier>;

    constructor(private testee: Symbol) {
        this.kernel = new Kernel();
        this.kernel.load(assignmentKernelModule);
        this.kernel.load(loggingKernelModule);
        this.collection = new LocalCollection<AssignmentDAO>("assignment");
        this.kernel.bind<SimpleCollection<AssignmentDAO>>(Types.Collection).toConstantValue(this.collection).whenTargetNamed("assignment");
        this.kernel.bind<SimpleCollection<NotificationDAO>>(Types.Collection).toConstantValue(new LocalCollection<NotificationDAO>("notification")).whenTargetNamed("notification");

        this._assignmentNotifierMock = TypeMoq.Mock.ofType<IAssignmentNotifier>(AssignmentNotifier);
        this.replaceWithMock<IAssignmentNotifier>(
            {
                type: AssignmentServiceTypes.IAssignmentNotifier,
                mock: this._assignmentNotifierMock
            });
    }

    protected getTestObject(): T {
        return this.kernel.get<T>(this.testee);
    }

    protected replaceWithMock<E>(options: {
        type: Symbol;
        mock: TypeMoq.Mock<E>;
    }) {
        this.kernel.unbind(options.type);
        this.kernel.bind<E>(options.type).toConstantValue(options.mock.object);
    }

    protected replace<E>(options: {
        type: Symbol;
        alternative: E;
    }) {
        this.kernel.unbind(options.type);
        this.kernel.bind<E>(options.type).toConstantValue(options.alternative);
    }

    expectNotificationWith(expectedOptions: IAssignmentSingleNotifierOptions) {
        this._assignmentNotifierMock
            .verify(x => x.notifyUserAboutAssignment(TypeMoq.It.isValue(expectedOptions)), TypeMoq.Times.once());
    }

    expectNoNotifications() {
        this._assignmentNotifierMock
            .verify(x => x.notifyUserAboutAssignment(TypeMoq.It.isAny()), TypeMoq.Times.never());
    }

    expectAmountOfNotificationsIs(amount: number) {
        this._assignmentNotifierMock
            .verify(x => x.notifyUserAboutAssignment(TypeMoq.It.isAny()), TypeMoq.Times.exactly(amount));
    }

    public assert(assignment: AssignmentDAO): AssignmentAsserts {
        return new AssignmentAsserts(assignment);
    }

    get testUser() {
        return testData.userId;
    }
}

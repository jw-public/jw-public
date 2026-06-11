import { AssignmentNotifier } from "../../../server/assignments/classes/AssignmentNotifier";
import {
  IAssignmentNotifier,
  IAssignmentSingleNotifierOptions,
} from "../../../server/assignments/interfaces/IAssignmentNotifier";

import {
  LocalCollection,
  TestCollection,
} from "../../3rdParty/minimongo-standalone/minimongo-standalone";

import { AssignmentDAO } from "../../../collections/lib/AssignmentsCollection";
import { AssignmentCopyActionDAO } from "../../../collections/lib/AssignmentCopyActionsCollection";
import { NotificationDAO } from "../../../collections/lib/classes/UserNotification";

import * as TypeMoq from "typemoq";

import { NullEmailSender } from "../../common/NullEmailSender";
import { overrideKeyFor, serviceKeyFor } from "../../common/serviceSymbols";
import { buildServices, ServiceOverrides, Services } from "../../../server/services";
import { AssignmentAsserts } from "./AssignmentAsserts";

const testData = {
  userId: "randomUserId",
};

// Assignment-focused test composition root with a mocked IAssignmentNotifier
// (replaces the old InversifyJS test kernel, ADR 0005).
export class AssignmentTestCaseWithNotifications<T> {
  public collection: TestCollection<AssignmentDAO>;
  protected overrides: ServiceOverrides = {};
  private _services: Services | null = null;
  private _assignmentNotifierMock: TypeMoq.Mock<IAssignmentNotifier>;

  constructor(private testee: symbol) {
    this.collection = new LocalCollection<AssignmentDAO>("assignment");

    this._assignmentNotifierMock = TypeMoq.Mock.ofType<IAssignmentNotifier>(AssignmentNotifier);
    this.overrides.assignmentNotifier = this._assignmentNotifierMock.object;
  }

  protected get services(): Services {
    if (this._services === null) {
      this._services = buildServices(
        {
          assignments: this.collection,
          assignmentCopyActions: new LocalCollection<AssignmentCopyActionDAO>("test-copy-actions"),
          notifications: new LocalCollection<NotificationDAO>("notification"),
          users: new LocalCollection("user"),
          groups: new LocalCollection("group"),
        },
        new NullEmailSender(),
        this.overrides,
      );
    }
    return this._services;
  }

  protected getTestObject(): T {
    return this.services[serviceKeyFor(this.testee)] as unknown as T;
  }

  protected replaceWithMock<E>(options: { type: symbol; mock: TypeMoq.Mock<E> }) {
    this.replace<E>({ type: options.type, alternative: options.mock.object });
  }

  protected replace<E>(options: { type: symbol; alternative: E }) {
    (this.overrides as any)[overrideKeyFor(options.type)] = options.alternative;
  }

  expectNotificationWith(expectedOptions: IAssignmentSingleNotifierOptions) {
    this._assignmentNotifierMock.verify(
      (x) => x.notifyUserAboutAssignment(TypeMoq.It.isValue(expectedOptions)),
      TypeMoq.Times.once(),
    );
  }

  expectNoNotifications() {
    this._assignmentNotifierMock.verify(
      (x) => x.notifyUserAboutAssignment(TypeMoq.It.isAny()),
      TypeMoq.Times.never(),
    );
  }

  expectAmountOfNotificationsIs(amount: number) {
    this._assignmentNotifierMock.verify(
      (x) => x.notifyUserAboutAssignment(TypeMoq.It.isAny()),
      TypeMoq.Times.exactly(amount),
    );
  }

  public assert(assignment: AssignmentDAO): AssignmentAsserts {
    return new AssignmentAsserts(assignment);
  }

  get testUser() {
    return testData.userId;
  }
}

import { MailingTypes } from "../../server/mailing/MailingTypes";

import * as TypeMoq from "typemoq";
import { AssignmentDAO } from "../../collections/lib/AssignmentsCollection";
import { AssignmentCopyActionDAO } from "../../collections/lib/AssignmentCopyActionsCollection";
import { IEmailSender, IEmailSendOptions } from "../../server/mailing/interfaces/IEmailSender";
import { NullEmailSender } from "./NullEmailSender";

import { SimpleCollection } from "../../imports/interfaces/SimpleCollection";
import { LocalCollection } from "../3rdParty/minimongo-standalone/minimongo-standalone";

import { Meteor } from "meteor/meteor";
import { NotificationDAO } from "../../collections/lib/classes/UserNotification";

import { GroupDAO } from "../../collections/lib/GroupCollection";
import { UserDAO } from "../../collections/lib/UserCollection";
import { buildServices, ServiceOverrides, Services } from "../../server/services";
import { NotificationsAsserts } from "./NotificationsAsserts";
import { overrideKeyFor, serviceKeyFor } from "./serviceSymbols";

// Test composition root (replaces the old InversifyJS test kernel, ADR
// 0005): builds the real service graph against in-memory collections.
// Subclass constructors may swap collaborators via replace*() BEFORE the
// first getTestObject() call — the graph is built lazily.
export class TestCase<T> {
  public userCollection: SimpleCollection<Meteor.User>;
  private notificationCollection: SimpleCollection<NotificationDAO>;
  public assignmentsCollection: SimpleCollection<AssignmentDAO>;
  public groupCollection: SimpleCollection<GroupDAO>;
  private copyActionsCollection: SimpleCollection<AssignmentCopyActionDAO>;

  protected overrides: ServiceOverrides = {};
  private _services: Services = null;
  public _emailSenderMock: TypeMoq.Mock<IEmailSender>;

  constructor(private testee: Symbol) {
    this.userCollection = new LocalCollection("user");
    this.notificationCollection = new LocalCollection<NotificationDAO>("test-notification");
    this.assignmentsCollection = new LocalCollection<AssignmentDAO>("test-assignments");
    this.groupCollection = new LocalCollection("group");
    this.copyActionsCollection = new LocalCollection("test-copy-actions");

    this._emailSenderMock = TypeMoq.Mock.ofType<IEmailSender>(NullEmailSender);

    this.userCollection.insert(testData);
  }

  protected get services(): Services {
    if (this._services === null) {
      this._services = buildServices(
        {
          assignments: this.assignmentsCollection,
          assignmentCopyActions: this.copyActionsCollection,
          notifications: this.notificationCollection,
          users: this.userCollection as SimpleCollection<UserDAO>,
          groups: this.groupCollection,
        },
        this._emailSenderMock.object,
        this.overrides,
      );
    }
    return this._services;
  }

  protected getTestObject(): T {
    return this.services[serviceKeyFor(this.testee)] as unknown as T;
  }

  protected replaceBindingWith<E>(options: { type: Symbol; newBinding: E }) {
    if (options.type === MailingTypes.IEmailSender) {
      throw new Error("Replace the email sender via _emailSenderMock instead.");
    }
    (this.overrides as any)[overrideKeyFor(options.type)] = options.newBinding;
  }

  protected replaceWithMock<E>(options: { type: Symbol; mock: TypeMoq.Mock<E> }) {
    this.replaceBindingWith<E>({
      type: options.type,
      newBinding: options.mock.object,
    });
  }

  public get emailAssert() {
    return {
      noEmailWasSent: () => {
        this._emailSenderMock.verify(emailSender => emailSender.send(TypeMoq.It.isAny()), TypeMoq.Times.never());
      },
      oneEmailWasSent: () => {
        this._emailSenderMock.verify(emailSender => emailSender.send(TypeMoq.It.isAny()), TypeMoq.Times.once());
      },
      emailWasSentWith: (options: IEmailSendOptions) => {
        this._emailSenderMock.verify(emailSender => emailSender.send(TypeMoq.It.isValue(options)), TypeMoq.Times.once());
      }
    }
  }

  get notificationAssert() {
    return new NotificationsAsserts(this.notificationCollection, this.testUserId);
  }

  get testUserId() {
    return testData._id;
  }

  get testUserEmail() {
    return testData.emails[0].address;
  }

}

const testData: UserDAO = {
  _id: "testUserId",
  emails: [
    {
      address: "test@trolley.com",
      verified: true
    }
  ],
  profile: {
    first_name: "Dummy",
    last_name: "Dusslig",
    notificationAsEmail: true,
    language: "de-de"
  }
};

import { Types } from "../../server/Types";
import { MailingTypes } from "../../server/mailing/MailingTypes";
import { assert } from "chai";

import * as TypeMoq from "typemoq";
import { kernelModule as mailingKernelModule } from "../../server/mailing/KernelModule";
import { kernelModule as userKernelModule } from "../../server/user/KernelModule";
import { kernelModule as assignmentKernelModule } from "../../server/assignments/KernelModule";
import { kernelModule as loggingKernelModule } from "../../server/logging/KernelModule";
import { IEmailSender, IEmailSendOptions } from "../../server/mailing/interfaces/IEmailSender";
import { NullEmailSender } from "./NullEmailSender";
import { IUserMailer } from "../../server/mailing/interfaces/IUserMailer";
import { UserEntry, AssignmentDAO } from "../../collections/lib/AssignmentsCollection";


import { injectable, inject, Kernel, interfaces } from "inversify";

import { LocalCollection } from "../3rdParty/minimongo-standalone/minimongo-standalone";
import { SimpleCollection } from "../../imports/interfaces/SimpleCollection";

import { Meteor } from "meteor/meteor";
import { NotificationDAO } from "../../collections/lib/classes/UserNotification";

import { NotificationsAsserts } from "./NotificationsAsserts";
import { UserDAO } from "../../collections/lib/UserCollection";
import { GroupDAO } from "../../collections/lib/GroupCollection";



export class TestCase<T> {
  public userCollection: SimpleCollection<Meteor.User>;
  private notificationCollection: SimpleCollection<NotificationDAO>;
  public assignmentsCollection: SimpleCollection<AssignmentDAO>;
  public groupCollection: SimpleCollection<GroupDAO>;

  protected kernel: interfaces.Kernel;
  public _emailSenderMock: TypeMoq.Mock<IEmailSender>;

  constructor(private testee: Symbol) {
    this.kernel = new Kernel();
    this.kernel.load(mailingKernelModule);
    this.kernel.load(userKernelModule);
    this.kernel.load(assignmentKernelModule);
    this.kernel.load(loggingKernelModule);

    this.userCollection = new LocalCollection("user");
    this.kernel.bind<SimpleCollection<Meteor.User>>(Types.Collection)
      .toConstantValue(this.userCollection)
      .whenTargetNamed("user");

    this.notificationCollection = new LocalCollection<NotificationDAO>("test-notification");
    this.kernel.bind<SimpleCollection<NotificationDAO>>(Types.Collection)
      .toConstantValue(this.notificationCollection)
      .whenTargetNamed("notification");

    this.assignmentsCollection = new LocalCollection<AssignmentDAO>("test-assignments");
    this.kernel.bind<SimpleCollection<AssignmentDAO>>(Types.Collection)
      .toConstantValue(this.assignmentsCollection)
      .whenTargetNamed("assignment");

    this.groupCollection = new LocalCollection("group");
    this.kernel.bind<SimpleCollection<Meteor.User>>(Types.Collection)
      .toConstantValue(this.groupCollection)
      .whenTargetNamed("group");


    this._emailSenderMock = TypeMoq.Mock.ofType<IEmailSender>(NullEmailSender);

    this.replaceWithMock<IEmailSender>(
      {
        type: MailingTypes.IEmailSender,
        mock: this._emailSenderMock
      });


    this.userCollection.insert(testData);

  }

  protected getTestObject(): T {
    return this.kernel.get<T>(this.testee);
  }

  protected replaceBindingWith<E>(options: {
    type: Symbol;
    newBinding: E;
  }) {
    if (this.kernel.isBound(options.type)) {
      this.kernel.unbind(options.type);
    }
    this.kernel.bind<E>(options.type).toConstantValue(options.newBinding);
  }

  protected replaceWithMock<E>(options: {
    type: Symbol;
    mock: TypeMoq.Mock<E>;
  }) {
    this.replaceBindingWith<E>({
      type: options.type,
      newBinding: options.mock.object
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

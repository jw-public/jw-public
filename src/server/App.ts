import { Types } from "./Types";

import { NotificationDAO } from "../collections/lib/classes/UserNotification";
import { IAssignmentCanceler } from "./assignments/interfaces/IAssignmentCanceler";
import { IAssignmentCloser } from "./assignments/interfaces/IAssignmentCloser";
import { IAssignmentParticipantControllerFactory } from "./assignments/interfaces/IAssignmentParticipantControllerFactory";
import { IAssignmentReenabler } from "./assignments/interfaces/IAssignmentReenabler";
import { IAssignmentRemover } from "./assignments/interfaces/IAssignmentRemover";


import { Kernel } from "inversify";
import getDecorators from "inversify-inject-decorators";


import { kernelModule as assignmentKernelModule } from "./assignments/KernelModule";
import { kernelModule as loggingModule } from "./logging/KernelModule";
import { kernelModule as mailingKernelModule } from "./mailing/KernelModule";
import { kernelModule as userKernelModule } from "./user/KernelModule";

import { AssignmentDAO, Assignments } from "../collections/lib/AssignmentsCollection";
import { Notifications } from "../collections/lib/NotificationCollection";
import { SimpleCollection } from "../imports/interfaces/SimpleCollection";
import { meteorSpecificBindings as mailingMeteorSpecificBindings } from "./mailing/MeteorSpecificBindings";

import { IAssignmentApplicationControllerFactory } from "./assignments/interfaces/IAssignmentApplicationControllerFactory";

import { Meteor } from "meteor/meteor";
import { AssignmentCopyActionDAO, AssignmentCopyActions } from "../collections/lib/AssignmentCopyActionsCollection";
import { GroupDAO, Groups } from "../collections/lib/GroupCollection";
import { UserDAO } from "../collections/lib/UserCollection";
import { AssignmentWeekCopyPaster } from "./assignments/classes/AssignmentWeekCopyPaster";

let kernel = new Kernel();

kernel.load(assignmentKernelModule);
kernel.load(userKernelModule);
kernel.load(mailingKernelModule);
kernel.load(mailingMeteorSpecificBindings);
kernel.load(loggingModule);

declare var Mongo: any;
kernel.bind<SimpleCollection<AssignmentDAO>>(Types.Collection).toConstantValue(Assignments).whenTargetNamed("assignment");
kernel.bind<SimpleCollection<AssignmentCopyActionDAO>>(Types.Collection).toConstantValue(AssignmentCopyActions).whenTargetNamed("assignmentCopyActions");
kernel.bind<SimpleCollection<NotificationDAO>>(Types.Collection).toConstantValue(Notifications).whenTargetNamed("notification");
kernel.bind<SimpleCollection<UserDAO>>(Types.Collection).toConstantValue(<any>Meteor.users).whenTargetNamed("user");
kernel.bind<SimpleCollection<GroupDAO>>(Types.Collection).toConstantValue(Groups).whenTargetNamed("group");


let { lazyInject } = getDecorators(kernel);

class AppRoot {

  @lazyInject(Types.IAssignmentApplicationControllerFactory)
  public assignmentApplicationControllerFactory: IAssignmentApplicationControllerFactory;

  @lazyInject(Types.IAssignmentParticipantControllerFactory)
  public assignmentParticipantControllerFactory: IAssignmentParticipantControllerFactory;

  @lazyInject(Types.IAssignmentRemover)
  public assignmentRemover: IAssignmentRemover;

  @lazyInject(Types.IAssignmentCanceler)
  public assignmentCanceler: IAssignmentCanceler;

  @lazyInject(Types.IAssignmentCloser)
  public assignmentCloser: IAssignmentCloser;

  @lazyInject(Types.IAssignmentReenabler)
  public assignmentReenabler: IAssignmentReenabler;

  @lazyInject(Types.AssignmentWeekCopyPaster)
  public assignmentWeekCopyPaster: AssignmentWeekCopyPaster;

  @lazyInject(Types.Collection)
  public assignments: SimpleCollection<AssignmentDAO>;
}

export const app = new AppRoot();

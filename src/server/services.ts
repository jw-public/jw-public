// Composition root: hand-wired service graph (replaces the InversifyJS
// kernel — see ADR 0005). This module must stay free of Meteor imports so
// the unit tests can build the same graph against in-memory collections.

import { AssignmentDAO } from "../collections/lib/AssignmentsCollection";
import { AssignmentCopyActionDAO } from "../collections/lib/AssignmentCopyActionsCollection";
import { GroupDAO } from "../collections/lib/GroupCollection";
import { NotificationDAO } from "../collections/lib/classes/UserNotification";
import { UserDAO } from "../collections/lib/UserCollection";
import { SimpleCollection } from "../imports/interfaces/SimpleCollection";
import { LoggerFactory } from "../imports/logging/LoggerFactory";
import { SimpleConsoleLoggerFactory } from "../imports/logging/SimpleConsoleLoggerFactory";

import { AssignmentApplicationController } from "./assignments/classes/AssignmentApplicationController";
import { AssignmentCanceler } from "./assignments/classes/AssignmentCanceler";
import { AssignmentCloser } from "./assignments/classes/AssignmentCloser";
import { AssignmentDaoNotifier } from "./assignments/classes/AssignmentDaoNotifier";
import { AssignmentDateParser } from "./assignments/classes/AssignmentDateParser";
import { AssignmentEmailNotifier } from "./assignments/classes/AssignmentEmailNotifier";
import { AssignmentNotifier } from "./assignments/classes/AssignmentNotifier";
import { AssignmentParticipantController } from "./assignments/classes/AssignmentParticipantController";
import { AssignmentParticipationNotifier } from "./assignments/classes/AssignmentParticipationNotifier";
import { AssignmentReenabler } from "./assignments/classes/AssignmentReenabler";
import { AssignmentRemover } from "./assignments/classes/AssignmentRemover";
import { AssignmentWeekCopyPaster } from "./assignments/classes/AssignmentWeekCopyPaster";
import { IAssignmentApplicationControllerFactory } from "./assignments/interfaces/IAssignmentApplicationControllerFactory";
import { IAssignmentContext } from "./assignments/interfaces/IAssignmentContext";
import { IAssignmentDaoNotifier } from "./assignments/interfaces/IAssignmentDaoNotifier";
import { IAssignmentDateParser } from "./assignments/interfaces/IAssignmentDateParser";
import { IAssignmentEmailNotifier } from "./assignments/interfaces/IAssignmentEmailNotifier";
import { IAssignmentNotifier } from "./assignments/interfaces/IAssignmentNotifier";
import { IAssignmentParticipantControllerFactory } from "./assignments/interfaces/IAssignmentParticipantControllerFactory";
import { IAssignmentParticipationNotifier } from "./assignments/interfaces/IAssignmentParticipationNotifier";
import { IEmailSender } from "./mailing/interfaces/IEmailSender";
import { IUserMailer } from "./mailing/interfaces/IUserMailer";
import { UserMailer } from "./mailing/classes/UserMailer";
import { IUserFactory } from "./user/interfaces/IUserFactory";
import { IUserSettingsReaderFactory } from "./user/interfaces/IUserSettingsReaderFactory";
import { UserFactory } from "./user/classes/UserFactory";
import { UserSettingsReaderFactory } from "./user/classes/UserSettingsReaderFactory";

export interface ServiceCollections {
  assignments: SimpleCollection<AssignmentDAO>;
  assignmentCopyActions: SimpleCollection<AssignmentCopyActionDAO>;
  notifications: SimpleCollection<NotificationDAO>;
  users: SimpleCollection<UserDAO>;
  groups: SimpleCollection<GroupDAO>;
}

// Tests swap individual collaborators for mocks via these hooks (the old
// kernel's unbind/rebind). Everything not overridden is built for real.
export interface ServiceOverrides {
  loggerFactory?: LoggerFactory;
  userFactory?: IUserFactory;
  userSettingsReaderFactory?: IUserSettingsReaderFactory;
  userMailer?: IUserMailer;
  dateParser?: IAssignmentDateParser;
  assignmentEmailNotifier?: IAssignmentEmailNotifier;
  assignmentNotifier?: IAssignmentNotifier;
  assignmentDaoNotifier?: IAssignmentDaoNotifier;
  participationNotifier?: IAssignmentParticipationNotifier;
}

export function buildServices(
  collections: ServiceCollections,
  emailSender: IEmailSender,
  overrides: ServiceOverrides = {},
) {
  const loggerFactory = overrides.loggerFactory ?? new SimpleConsoleLoggerFactory();

  const userFactory = overrides.userFactory ?? new UserFactory(collections.users);
  const userSettingsReaderFactory =
    overrides.userSettingsReaderFactory ?? new UserSettingsReaderFactory(collections.users);
  const userMailer =
    overrides.userMailer ?? new UserMailer(emailSender, userFactory, loggerFactory);
  const dateParser = overrides.dateParser ?? new AssignmentDateParser();

  const assignmentEmailNotifier =
    overrides.assignmentEmailNotifier ??
    new AssignmentEmailNotifier(
      collections.users,
      collections.assignments,
      collections.groups,
      userMailer,
      userSettingsReaderFactory,
      dateParser,
    );
  const assignmentNotifier =
    overrides.assignmentNotifier ??
    new AssignmentNotifier(assignmentEmailNotifier, collections.notifications, loggerFactory);
  const assignmentDaoNotifier =
    overrides.assignmentDaoNotifier ?? new AssignmentDaoNotifier(assignmentNotifier);
  const participationNotifier =
    overrides.participationNotifier ?? new AssignmentParticipationNotifier(assignmentNotifier);

  // The controllers carry per-call state (the assignment context), so the
  // factories build a fresh instance per invocation — exactly what the old
  // kernel's transient scope + toFactory bindings did.
  const assignmentApplicationControllerFactory: IAssignmentApplicationControllerFactory = (
    assignmentId: string,
  ) => {
    const controller = new AssignmentApplicationController(collections.assignments, loggerFactory);
    const context: IAssignmentContext = { getAssignmentId: () => assignmentId };
    (controller as any).assignmentContext = context;
    return controller;
  };

  const assignmentParticipantControllerFactory: IAssignmentParticipantControllerFactory = (
    assignmentId: string,
  ) => {
    const controller = new AssignmentParticipantController(
      collections.assignments,
      participationNotifier,
    );
    const context: IAssignmentContext = { getAssignmentId: () => assignmentId };
    (controller as any).assignmentContext = context;
    return controller;
  };

  const assignmentCloser = new AssignmentCloser(
    collections.assignments,
    assignmentNotifier,
    assignmentParticipantControllerFactory,
    loggerFactory,
  );
  const assignmentCanceler = new AssignmentCanceler(collections.assignments, assignmentDaoNotifier);
  const assignmentReenabler = new AssignmentReenabler(
    collections.assignments,
    assignmentDaoNotifier,
  );
  const assignmentRemover = new AssignmentRemover(collections.assignments, assignmentDaoNotifier);
  const assignmentWeekCopyPaster = new AssignmentWeekCopyPaster(
    collections.assignments,
    collections.assignmentCopyActions,
    loggerFactory,
  );

  return {
    loggerFactory,
    userFactory,
    userSettingsReaderFactory,
    userMailer,
    dateParser,
    assignmentEmailNotifier,
    assignmentNotifier,
    assignmentDaoNotifier,
    participationNotifier,
    assignmentApplicationControllerFactory,
    assignmentParticipantControllerFactory,
    assignmentCloser,
    assignmentCanceler,
    assignmentReenabler,
    assignmentRemover,
    assignmentWeekCopyPaster,
    assignments: collections.assignments,
  };
}

export type Services = ReturnType<typeof buildServices>;

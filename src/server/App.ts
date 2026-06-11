// Production composition root (see ADR 0005): wires the real Meteor
// collections and the Meteor Email sender into the hand-built service graph.

import { Email } from "meteor/email";
import { Meteor } from "meteor/meteor";

import { AssignmentCopyActions } from "../collections/lib/AssignmentCopyActionsCollection";
import { Assignments } from "../collections/lib/AssignmentsCollection";
import { Groups } from "../collections/lib/GroupCollection";
import { Notifications } from "../collections/lib/NotificationCollection";
import { JsnLogFactory } from "../imports/logging/JsnLogFactory";
import { IEmailSender } from "./mailing/interfaces/IEmailSender";
import { buildServices } from "./services";

export const app = buildServices(
  {
    assignments: Assignments,
    assignmentCopyActions: AssignmentCopyActions,
    notifications: Notifications,
    users: Meteor.users as any,
    groups: Groups,
  },
  Email as IEmailSender,
  { loggerFactory: new JsnLogFactory() },
);

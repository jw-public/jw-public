import { Blueprints } from './../collections/lib/BlueprintCollection';
import { Meteor, Subscription } from "meteor/meteor";
import { Template } from "meteor/templating";
import { Mongo } from "meteor/mongo";
import { Accounts } from "meteor/accounts-base";
import { Roles } from "meteor/alanning:roles";
import { check, Match } from "meteor/check";

import Group from "../collections/lib/classes/Group";
import { GroupApplicationController } from "../collections/lib/classes/Group";
import { Groups, GroupDAO } from "../collections/lib/GroupCollection";

import User from "../collections/lib/classes/User";
import * as UserCollection from "../collections/lib/UserCollection";
import * as UserNotification from "../collections/lib/classes/UserNotification";

import { Notifications } from "../collections/lib/NotificationCollection";

import Assignment from "../collections/lib/classes/Assignment";
import { AssignmentState } from "../collections/lib/classes/AssignmentState";
import { UserEntry, AssignmentDAO, Assignments } from "../collections/lib/AssignmentsCollection";

import { Security } from "meteor/ongoworks:security";

Security.defineMethod<GroupDAO>("ifIsGroupCoordinator", {
  fetch: ["coordinators"],
  transform: null,
  deny: function (type, arg, userId, doc) {
    let group = Group.createFromDAO(doc);
    return !group.isCoordinatorById(userId);
  }
});

Security.defineMethod<Meteor.User>("isOwnUserEntry", {
  fetch: [],
  transform: null,
  deny: function (type, arg, userId, doc) {
    return doc._id !== userId;
  }
});

Security.defineMethod<AssignmentDAO>("ifGroupOfAssignmentIsCoordinatedByUser", {
  fetch: ["group"],
  transform: null,
  deny: function (type, arg, userId, doc) {
    let group = Group.createFromId(doc.group);
    let user = User.createFromId(userId);
    return !(user.isCoordinatorInAnyGroup() && group.isCoordinatorById(userId));
  }
});

Security.defineMethod<UserNotification.NotificationDAO>("ifIsOwnNotification", {
  fetch: ["userId"],
  transform: null,
  deny: function (type, arg, userId, doc) {
    return doc.userId !== userId;
  }
});


Security.permit(["insert", "update", "remove"]).collections(Groups).ifHasRole("admin").allowInClientCode();

/* Gruppenkoordinatoren dürfen alles außer die Koordinatoren-Berechtigungen ändern */
Security.permit(["update"]).collections(Groups).ifIsGroupCoordinator().exceptProps(["coordinators"]).allowInClientCode();

Security.permit(["insert", "update"]).collections(Assignments).ifGroupOfAssignmentIsCoordinatedByUser().allowInClientCode();
Security.permit(["insert", "update"]).collections(Blueprints).ifGroupOfAssignmentIsCoordinatedByUser().allowInClientCode();
Security.permit(["update"]).collections(Meteor.users).ifHasRole("admin").allowInClientCode();
Security.permit(["update"]).collections(Meteor.users).isOwnUserEntry().onlyProps(["profile", "updatedAt"]).allowInClientCode();
Security.permit(["update", "remove"]).collections(Notifications).ifIsOwnNotification().allowInClientCode();

import { Meteor } from "meteor/meteor";
import * as RolesHelper from "../lib/RolesHelper";
import * as _ from "underscore";

import { Blueprints } from "./../collections/lib/BlueprintCollection";
import { Groups } from "../collections/lib/GroupCollection";
import { Notifications } from "../collections/lib/NotificationCollection";
import { Assignments } from "../collections/lib/AssignmentsCollection";

// Native allow rules (replacing ongoworks:security, which never got a
// Meteor-3-compatible release). Deny-by-default still applies: anything not
// allowed here must go through a Meteor method.

function isAdmin(userId: string): boolean {
  return RolesHelper.userIsAdmin(userId);
}

function isGroupCoordinator(userId: string, groupId: string): boolean {
  if (!userId || !groupId) {
    return false;
  }
  return !!Groups.findOne({ _id: groupId, coordinators: { $in: [userId] } }, { fields: { _id: 1 } });
}

// --- Groups -------------------------------------------------------------

Groups.allow({
  insert: (userId) => isAdmin(userId),
  remove: (userId) => isAdmin(userId),
  // Coordinators may edit their group but never the coordinator list.
  update: (userId, doc, fields) => {
    if (isAdmin(userId)) {
      return true;
    }
    return isGroupCoordinator(userId, doc._id) && !_.contains(fields, "coordinators");
  },
});

// --- Assignments & Blueprints --------------------------------------------

function allowAssignmentWrite(userId: string, doc: { group?: string }): boolean {
  return isGroupCoordinator(userId, doc.group);
}

Assignments.allow({
  insert: allowAssignmentWrite,
  update: allowAssignmentWrite,
});

Blueprints.allow({
  insert: allowAssignmentWrite,
  update: allowAssignmentWrite,
});

// --- Users ----------------------------------------------------------------

Meteor.users.allow({
  update: (userId, doc, fields) => {
    if (isAdmin(userId)) {
      return true;
    }
    // Own profile only, and only the whitelisted top-level fields.
    const allowedOwnFields = ["profile", "updatedAt"];
    return doc._id === userId && _.difference(fields, allowedOwnFields).length === 0;
  },
});

// --- Notifications ----------------------------------------------------------

Notifications.allow({
  update: (userId, doc) => !!userId && doc.userId === userId,
  remove: (userId, doc) => !!userId && doc.userId === userId,
});

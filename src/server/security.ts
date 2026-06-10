import { Meteor } from "meteor/meteor";
import * as _ from "underscore";

import * as RolesHelper from "../lib/RolesHelper";

import { Blueprints } from "./../collections/lib/BlueprintCollection";
import { Groups } from "../collections/lib/GroupCollection";
import { Notifications } from "../collections/lib/NotificationCollection";
import { Assignments } from "../collections/lib/AssignmentsCollection";

// Native allow rules (replacing ongoworks:security, which never got a
// Meteor-3-compatible release). Deny-by-default still applies: anything not
// allowed here must go through a Meteor method. Meteor 3 awaits async
// allow callbacks.
//
// Client writes arrive on the *Async method variants on Meteor 3 (the
// client stubs call /collection/insertAsync etc.), which validate against
// the insertAsync/updateAsync/removeAsync rule keys — a group that only
// registers the legacy sync keys leaves the async paths deny-by-default.
// Register every rule under both keys.

function isAdmin(userId: string): Promise<boolean> {
  return RolesHelper.userIsAdminAsync(userId);
}

async function isGroupCoordinator(userId: string, groupId: string): Promise<boolean> {
  if (!userId || !groupId) {
    return false;
  }
  const group = await Groups.findOneAsync(
    { _id: groupId, coordinators: { $in: [userId] } },
    { fields: { _id: 1 } },
  );
  return !!group;
}

function allowBoth(rules: { insert?: Function; update?: Function; remove?: Function }): any {
  const both: any = { ...rules };
  if (rules.insert) {
    both.insertAsync = rules.insert;
  }
  if (rules.update) {
    both.updateAsync = rules.update;
  }
  if (rules.remove) {
    both.removeAsync = rules.remove;
  }
  return both;
}

// --- Groups -------------------------------------------------------------

Groups.allow(allowBoth({
  insert: (userId: string) => isAdmin(userId),
  remove: (userId: string) => isAdmin(userId),
  // Coordinators may edit their group but never the coordinator list.
  update: async (userId: string, doc: any, fields: string[]) => {
    if (await isAdmin(userId)) {
      return true;
    }
    return (await isGroupCoordinator(userId, doc._id)) && !_.contains(fields, "coordinators");
  },
}));

// --- Assignments & Blueprints --------------------------------------------

function allowAssignmentWrite(userId: string, doc: { group?: string }): Promise<boolean> {
  return isGroupCoordinator(userId, doc.group);
}

Assignments.allow(allowBoth({
  insert: allowAssignmentWrite,
  update: allowAssignmentWrite,
}));

Blueprints.allow(allowBoth({
  insert: allowAssignmentWrite,
  update: allowAssignmentWrite,
}));

// --- Users ----------------------------------------------------------------

Meteor.users.allow(allowBoth({
  update: async (userId: string, doc: any, fields: string[]) => {
    if (await isAdmin(userId)) {
      return true;
    }
    // Own profile only, and only the whitelisted top-level fields.
    const allowedOwnFields = ["profile", "updatedAt"];
    return doc._id === userId && _.difference(fields, allowedOwnFields).length === 0;
  },
}));

// --- Notifications ----------------------------------------------------------

Notifications.allow(allowBoth({
  update: (userId: string, doc: any) => !!userId && doc.userId === userId,
  remove: (userId: string, doc: any) => !!userId && doc.userId === userId,
}));

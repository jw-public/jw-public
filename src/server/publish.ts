import * as _ from "underscore";
import { Blueprints } from "./../collections/lib/BlueprintCollection";

import * as RolesHelper from "../lib/RolesHelper";
import { check } from "meteor/check";
import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";

import { publishCount } from "../lib/Counts";

import { GroupApplicationController } from "../collections/lib/classes/Group";
import { GroupDAO, Groups } from "../collections/lib/GroupCollection";

import * as UserNotification from "../collections/lib/classes/UserNotification";
import * as UserCollection from "../collections/lib/UserCollection";

import { Notifications } from "../collections/lib/NotificationCollection";

import { AssignmentDAO, Assignments } from "../collections/lib/AssignmentsCollection";
import Assignment from "../collections/lib/classes/Assignment";
import { AssignmentState } from "../collections/lib/classes/AssignmentState";

import AssignmentCountAccessor from "../collections/lib/classes/AssignmentCountAccessor";

import moment from "moment";

/**
 * Damit im Client bestimmte Daten gelesen werden können, müssen diese "gepublished" werden.
 *
 * Meteor 3: Alle Berechtigungs-Checks laufen async mit Inline-Queries — die
 * isomorphen Domänenklassen sind synchron und damit client-only.
 */

// --- Async access helpers ---------------------------------------------------

async function getGroupDoc(groupId: string): Promise<GroupDAO | undefined> {
  return await Groups.findOneAsync({ _id: groupId });
}

function isCoordinatorOf(group: GroupDAO | undefined, userId: string): boolean {
  return !!group && _.contains(group.coordinators || [], userId);
}

async function isMemberOf(group: GroupDAO | undefined, userId: string): Promise<boolean> {
  if (!group || !userId) {
    return false;
  }
  const member = await Meteor.users.findOneAsync(
    { _id: userId, groups: { $in: [group._id] } },
    { fields: { _id: 1 } },
  );
  return !!member;
}

// --- Rollen ------------------------------------------------------------------

// alanning:roles v4: publish the logged-in user's own role assignments
// (v4 does not auto-publish them).
Meteor.publish(null, function () {
  if (!this.userId) {
    return this.ready();
  }
  return Meteor.roleAssignment.find({ "user._id": this.userId });
});

// Same data as a NAMED publication: null publications expose no ready()
// signal on the client, but the admin route guard must wait for the role
// assignments before deciding (cold-load race).
Meteor.publish("ownRoles", function () {
  if (!this.userId) {
    return this.ready();
  }
  return Meteor.roleAssignment.find({ "user._id": this.userId });
});

Meteor.publish("roles", async function () {
  if (await RolesHelper.userIsAdminAsync(this.userId)) {
    // Die folgenden Daten werden nur freigegeben, wenn ein Benutzer ein Admin ist.
    return [Meteor.roles.find(), Meteor.roleAssignment.find()]; // Rollen + Zuweisungen freigeben
  } else {
    // user not authorized.
    return this.ready();
  }
});

Meteor.publish("groupMembers", async function (groupId: string) {
  check(groupId, String);

  if (!this.userId) {
    return this.ready();
  }

  const group = await getGroupDoc(groupId);
  const isCoordinator =
    isCoordinatorOf(group, this.userId) || (await RolesHelper.userIsAdminAsync(this.userId));
  if (!isCoordinator) {
    return this.ready();
  }
  return UserPublication.usersNonReactive({
    groups: {
      $in: [groupId],
    },
  });
});

// Replaces aldeed:tabular's internal publication for the admin user table.
Meteor.publish("adminAllUsers", async function () {
  if (!(await RolesHelper.userIsAdminAsync(this.userId))) {
    return this.ready();
  }
  return Meteor.users.find(
    {},
    {
      fields: {
        _id: 1,
        profile: 1,
        emails: 1,
        groups: 1,
        notice: 1,
      },
    },
  );
});

Meteor.publish("groupApplicants", async function (groupId: string) {
  check(groupId, String);

  if (!this.userId) {
    return this.ready();
  }

  const group = await getGroupDoc(groupId);
  const isCoordinator =
    isCoordinatorOf(group, this.userId) || (await RolesHelper.userIsAdminAsync(this.userId));
  if (!isCoordinator) {
    return this.ready();
  }
  return Meteor.users.find(
    {
      "profile.pendingGroups": {
        $in: [groupId],
      },
    },
    {
      fields: {
        _id: 1,
        profile: 1,
        emails: 1,
      },
    },
  );
});

Meteor.publish("groupCoordinators", async function (groupId: string) {
  check(groupId, String);

  if (!this.userId) {
    return this.ready();
  }

  const group = await getGroupDoc(groupId);
  const isMemberOrCoordinator =
    isCoordinatorOf(group, this.userId) || (await isMemberOf(group, this.userId));
  if (!group || !isMemberOrCoordinator) {
    return this.ready();
  }

  const ids = _.toArray<string>(group.coordinators || []);

  return UserPublication.users({ _id: { $in: ids } });
});

// Userdaten
Meteor.publishComposite(
  "ownUserData",
  function (): Meteor.PublishCompositeConfig<UserCollection.UserDAO> | null {
    if (!this.userId) {
      return null;
    }

    return {
      find: UserPublication.theUser(this.userId),
      children: [
        {
          find: UserPublication.groupsOfUser,
        },
        {
          find: UserPublication.pendingGroupsOfUser,
        },
      ],
    };
  },
);

namespace UserPublication {
  export function usersNonReactive(
    selector: Mongo.Selector<UserCollection.UserDAO>,
    limit?: number,
  ): Mongo.Cursor<UserCollection.UserDAO> {
    if (!limit) {
      limit = 0;
    }
    let userCursor = Meteor.users.find(selector, {
      fields: {
        _id: 1,
        profile: 1,
        groups: 1,
        emails: 1,
      },
      limit,
      reactive: false,
    });
    return userCursor;
  }

  export function users(
    selector: Mongo.Selector<UserCollection.UserDAO>,
    limit?: number,
  ): Mongo.Cursor<UserCollection.UserDAO> {
    if (!limit) {
      limit = 0;
    }
    let userCursor = Meteor.users.find(selector, {
      fields: {
        _id: 1,
        profile: 1,
        groups: 1,
      },
      limit,
    });
    return userCursor;
  }

  export function theUser(userId: string) {
    return () => {
      return users({ _id: userId });
    };
  }

  export function groupsOfUser(user: UserCollection.UserDAO) {
    let groupIds = user.groups;

    return Groups.find({ _id: { $in: groupIds } });
  }

  export function pendingGroupsOfUser(user: UserCollection.UserDAO) {
    let groupIds = user.profile?.pendingGroups;

    if (!_.isArray(groupIds)) {
      groupIds = [];
    }

    return Groups.find({ _id: { $in: groupIds } }, { fields: { _id: 1, name: 1 } });
  }
}

Meteor.publishComposite(
  "notifications",
  function (
    limit?: number,
  ): Meteor.PublishCompositeConfig<UserNotification.NotificationDAO> | null {
    if (!this.userId) {
      return null;
    }

    if (!limit) {
      limit = 0;
    }

    return {
      find: NotificationPublication.notificationsOfUserWithLimit(this.userId, limit),
      children: [
        {
          find: NotificationPublication.assignmentsOfNotification,
        },
      ],
    };
  },
);

namespace NotificationPublication {
  export function notificationsOfUserWithLimit(userId: string, limit: number) {
    return () => {
      let notificationsCursor = Notifications.find(
        { userId: userId },
        { sort: { when: -1 }, limit: limit },
      );
      return notificationsCursor;
    };
  }

  export function assignmentsOfNotification(notification: UserNotification.NotificationDAO) {
    const assignmentOptions = notification.assignmentOptions;

    if (!assignmentOptions || !_.has(assignmentOptions, "id")) {
      return null;
    }

    let assignmentsCursor = Assignments.find(
      { _id: assignmentOptions.id },
      {
        fields: {
          name: 1,
          start: 1,
          end: 1,
          group: 1,
          cancelationReason: 1,
          _id: 1,
        },
        limit: 1,
      },
    );

    return assignmentsCursor;
  }
}

Meteor.publish(
  GroupApplicationController.APPLICATION_COUNT_SUBSCRIPTION,
  async function (groupId: string) {
    check(groupId, String);

    let applicationController = new GroupApplicationController(groupId);
    let cursor = applicationController.getApplicantsIdCursorReactive();

    await publishCount(this, applicationController.counterName, cursor);
  },
);

Meteor.publish(
  AssignmentCountAccessor.ASSIGNMENT_COUNT_SUBSCRIPTION,
  async function (groupId: string) {
    check(groupId, String);

    let countAccessor = new AssignmentCountAccessor(groupId);
    let cursor = countAccessor.getAssignmentsCursor();

    await publishCount(this, countAccessor.counterName, cursor);
  },
);

// Gruppen
Meteor.publish("coordinatingGroups", async function () {
  if (this.userId) {
    if (await RolesHelper.userIsAdminAsync(this.userId)) {
      // Admin darf alle Gruppen sehen
      return Groups.find();
    }

    return Groups.find({
      coordinators: { $in: [this.userId] },
    });
  } else {
    return this.ready();
  }
});

// Gruppe
Meteor.publish("singleGroup", async function (groupId: string) {
  check(groupId, String);

  if (!this.userId) {
    return this.ready();
  }

  const group = await getGroupDoc(groupId);
  if (!group) {
    return this.ready();
  }

  if (
    (await isMemberOf(group, this.userId)) ||
    isCoordinatorOf(group, this.userId) ||
    (await RolesHelper.userIsAdminAsync(this.userId))
  ) {
    // Admin darf alle Gruppen sehen
    return Groups.find({ _id: groupId });
  } else {
    return this.ready();
  }
});

Meteor.publish("allBlueprintsOfGroup", async function (groupId: string) {
  check(groupId, String);

  if (!this.userId) {
    return this.ready();
  }

  const group = await getGroupDoc(groupId);
  if (!group) {
    return this.ready();
  }

  if (isCoordinatorOf(group, this.userId) || (await RolesHelper.userIsAdminAsync(this.userId))) {
    // Admin darf alle Gruppen sehen
    return Blueprints.find({ group: groupId });
  } else {
    return this.ready();
  }
});

Meteor.publishComposite(
  "singleAssignment",
  async function (
    assignmentId: string,
  ): Promise<Meteor.PublishCompositeConfig<AssignmentDAO> | null> {
    check(assignmentId, String);

    if (!this.userId) {
      return null;
    }

    const assignmentDao = await Assignments.findOneAsync({ _id: assignmentId });
    if (!assignmentDao) {
      return null;
    }

    const group = await getGroupDoc(assignmentDao.group);
    const hasRight = isCoordinatorOf(group, this.userId) || (await isMemberOf(group, this.userId));
    if (!hasRight) {
      return null;
    }

    const startOfDay = moment(assignmentDao.start).startOf("day");
    const endOfDay = startOfDay.clone().endOf("day");

    return {
      find: () => {
        /*
         *  Query: Gibt Details zum gegebenen Assignment und allen anderen Assignments des gleichen Tages.
         *  Die Termine müssen alle den gleichen Namen haben, geschlossen sein und mindestens einen Teilnehmer haben.
         */
        return Assignments.find({
          // ODER-Verknüpfung der folgenden Bedingungen:
          $or: [
            // Die ID entspricht der gegebenen assignmentId
            { _id: assignmentId },
            /*
             *  Termine einer Gruppe, die am gleichen Tag stattfinden,
             *  müssen alle den gleichen Namen haben, geschlossen sein
             *  und mindestens einen Teilnehmer haben.
             */
            {
              group: assignmentDao.group,
              state: AssignmentState[AssignmentState.Closed],
              name: assignmentDao.name,
              start: { $gte: startOfDay.toDate(), $lt: endOfDay.toDate() },
              participants: { $exists: true, $not: { $size: 0 } },
            },
          ],
        });
      },
      children: [
        {
          find: (assignment: AssignmentDAO) => {
            let participants = assignment.participants.map((entry) => entry.user);
            let applicants = assignment.applicants.map((entry) => entry.user);
            let contactPersons = assignment.contacts;

            let allUsers = _.union(participants, applicants, contactPersons);

            let fieldsToPublish: Mongo.FieldSpecifier = { _id: 1, profile: 1, "emails.address": 1 }; // Profilinfos und E-Mail-Adressen für jeden User sichtbar

            let cursor = Meteor.users.find({ _id: { $in: allUsers } }, { fields: fieldsToPublish });
            return cursor;
          },
        },
      ],
    };
  },
);

// Replaces aldeed:tabular's internal publication for the coordinator's
// assignment table. The one-month-back cap matches the old tabular selector.
Meteor.publish(
  "assignmentsForGroupTable",
  async function (groupId: string, startDate: Date, endDate: Date) {
    check(groupId, String);
    check(startDate, Date);
    check(endDate, Date);

    if (!this.userId) {
      return this.ready();
    }

    const group = await getGroupDoc(groupId);
    const isCoordinator =
      isCoordinatorOf(group, this.userId) || (await RolesHelper.userIsAdminAsync(this.userId));
    if (!isCoordinator) {
      return this.ready();
    }

    let earliest = moment().subtract(1, "month").toDate();
    let effectiveStart = startDate > earliest ? startDate : earliest;

    return Assignments.find({
      group: groupId,
      start: { $gte: effectiveStart },
      end: { $lte: endDate },
    });
  },
);

Meteor.publish("assignmentsInMonthPerGroup", async function (groupId: string, monthYear: string) {
  check(groupId, String);
  check(monthYear, String);

  if (!this.userId) {
    return this.ready();
  }

  const group = await getGroupDoc(groupId);
  const hasRight = isCoordinatorOf(group, this.userId) || (await isMemberOf(group, this.userId));
  if (hasRight) {
    let date = moment(monthYear, Assignment.MonthStringFormat);

    return Assignments.find(
      {
        group: groupId,
        year: date.year(),
        month: date.month(),
        end: { $gte: moment().startOf("day").toDate() },
      },
      {
        fields: {
          _id: 1,
          group: 1,
          start: 1,
          end: 1,
          name: 1,
          state: 1,
          applicants: 1,
          participants: 1,
          userGoal: 1,
          yearOfIsoWeek: 1,
          year: 1,
          month: 1,
          isoWeek: 1,
        },
      },
    );
  } else {
    return this.ready();
  }
});

Meteor.publish("groupName", function (id) {
  check(id, String);

  return Groups.find({ _id: id }, { fields: { _id: 1, name: 1 } });
});

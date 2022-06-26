import * as _ from "underscore";
import { Blueprints } from './../collections/lib/BlueprintCollection';

import { Roles } from "meteor/alanning:roles";
import { check } from "meteor/check";
import { Meteor, Subscription } from "meteor/meteor";
import { Mongo } from "meteor/mongo";

import { Counts } from "meteor/tmeasday:publish-counts";


import Group, { GroupApplicationController } from "../collections/lib/classes/Group";
import { Groups } from "../collections/lib/GroupCollection";

import User from "../collections/lib/classes/User";
import * as UserNotification from "../collections/lib/classes/UserNotification";
import * as UserCollection from "../collections/lib/UserCollection";

import { Notifications } from "../collections/lib/NotificationCollection";

import { AssignmentDAO, Assignments } from "../collections/lib/AssignmentsCollection";
import Assignment from "../collections/lib/classes/Assignment";
import { AssignmentState } from "../collections/lib/classes/AssignmentState";


import AssignmentCountAccessor from "../collections/lib/classes/AssignmentCountAccessor";

import * as moment from "moment";

/**
 * Damit im Client bestimmte Daten gelesen werden können, müssen diese "gepublished" werden.
 */


// Rollenbezeichnungen
Meteor.publish("roles", function () {
  if (Roles.userIsInRole(this.userId, ["admin"])) {
    // Die folgenden Daten werden nur freigegeben, wenn ein Benutzer ein Admin ist.
    return Meteor.roles.find(); // Rollen freigeben
  } else {
    // user not authorized.
    return null;
  }
});

Meteor.publish("groupMembers", function (groupId: string) {
  check(groupId, String);

  let group = new Group(groupId);
  let user = new User(this.userId);

  let isCoordinator = group.isCoordinator(user) || Roles.userIsInRole(user.getId(), "admin");
  let hasRight: boolean = user.exists() && isCoordinator;
  if (!hasRight) {
    return null;
  }
  return UserPublication.usersNonReactive({
    groups: {
      $in: [groupId]
    }
  });
});

Meteor.publish("groupCoordinators", function (groupId: string) {
  check(groupId, String);
  let group = new Group(groupId);
  let user = new User(this.userId);

  let isGroupMemberOrCoordinator = (group.isMember(user) || group.isCoordinator(user));
  let hasRight: boolean = user.exists() && isGroupMemberOrCoordinator;
  if (!hasRight) {
    return null;
  }

  let ids = _.toArray<string>(group.getCoordinatorIds());

  return UserPublication.users({ "_id": { "$in": ids } });
});

// Userdaten
Meteor.publishComposite("ownUserData", function (): Meteor.PublishCompositeConfig<UserCollection.UserDAO> {

  if (!this.userId) {
    return null;
  }


  return {
    find: UserPublication.theUser(this.userId),
    children: [{
      find: UserPublication.groupsOfUser
    },
    {
      find: UserPublication.pendingGroupsOfUser
    }
    ]
  };
});

namespace UserPublication {

  export function usersNonReactive(selector: Mongo.Selector, limit?: number): Mongo.Cursor<UserCollection.UserDAO> {
    if (!limit) {
      limit = 0;
    }
    let userCursor = Meteor.users.find(selector, {
      fields: {
        "_id": 1,
        profile: 1,
        groups: 1,
      },
      limit,
      reactive: false
    });
    return userCursor;

  }

  export function users(selector: Mongo.Selector, limit?: number): Mongo.Cursor<UserCollection.UserDAO> {
    if (!limit) {
      limit = 0;
    }
    let userCursor = Meteor.users.find(selector, {
      fields: {
        "_id": 1,
        profile: 1,
        groups: 1,
      },
      limit
    });
    return userCursor;

  }

  export function theUser(userId: string) {
    return () => { return users({ "_id": userId }) };
  }

  export function groupsOfUser(user: UserCollection.UserDAO) {
    let groupIds = user.groups;

    return Groups.find({ "_id": { "$in": groupIds } });
  }

  export function pendingGroupsOfUser(user: UserCollection.UserDAO) {
    let groupIds = user.profile.pendingGroups;

    if (!_.isArray(groupIds)) {
      groupIds = [];
    }

    return Groups.find({ _id: { $in: groupIds } }, { fields: { "_id": 1, "name": 1 } });
  }
}


Meteor.publishComposite("notifications", function (limit?: number): Meteor.PublishCompositeConfig<UserNotification.NotificationDAO> {

  if (!this.userId) {
    return null;
  }


  if (!limit) {
    limit = 0;
  }

  return {
    find: NotificationPublication.notificationsOfUserWithLimit(this.userId, limit),
    children: [{
      find: NotificationPublication.assignmentsOfNotification
    }
    ]
  };
});

namespace NotificationPublication {
  export function notificationsOfUserWithLimit(userId: string, limit: number) {
    return () => {
      let notificationsCursor = Notifications.find({ "userId": userId }, { sort: { when: -1 }, limit: limit });
      return notificationsCursor;
    };
  }

  export function assignmentsOfNotification(notification: UserNotification.NotificationDAO) {
    let notificationLinksToAssignment: boolean = _.has(notification, "assignmentOptions") && _.has(notification.assignmentOptions, "id");

    if (!notificationLinksToAssignment) {
      return null;
    }

    let assignmentsCursor = Assignments.find({ _id: notification.assignmentOptions.id }, {
      fields: {
        name: 1,
        start: 1,
        end: 1,
        group: 1,
        cancelationReason: 1,
        _id: 1
      }, limit: 1
    });

    return assignmentsCursor;
  }
}

Meteor.publish(GroupApplicationController.APPLICATION_COUNT_SUBSCRIPTION, function (groupId: string) {
  check(groupId, String);

  let context: Subscription = this;
  let applicationController = new GroupApplicationController(groupId);


  let cursor = applicationController.getApplicantsIdCursorReactive();


  Counts.publish(this, applicationController.counterName, cursor);
});

Meteor.publish(AssignmentCountAccessor.ASSIGNMENT_COUNT_SUBSCRIPTION, function (groupId: string) {
  check(groupId, String);

  let context: Subscription = this;
  let countAccessor = new AssignmentCountAccessor(groupId);


  let cursor = countAccessor.getAssignmentsCursor();

  let thereAreSomeAssignmentsAvailable = cursor.count() > 0;
  let nonReactive = thereAreSomeAssignmentsAvailable;

  Counts.publish(this, countAccessor.counterName, cursor, { nonReactive });
});


// Gruppen
Meteor.publish("coordinatingGroups", function () {
  if (this.userId) {

    if (Roles.userIsInRole(this.userId, ["admin"])) { // Admin darf alle Gruppen sehen
      return Groups.find();
    }

    return Groups.find({
      coordinators: { $in: [this.userId] }
    });

  } else {
    return null;
  }
});




// Gruppe
Meteor.publish("singleGroup", function (groupId: string) {
  if (this.userId) {
    let group: Group = new Group(groupId);
    if (!group.exists()) {
      return null;
    }

    if (group.isMemberById(this.userId) || Roles.userIsInRole(this.userId, ["admin"])) { // Admin darf alle Gruppen sehen
      return Groups.find({ _id: group.getId() });
    } else {
      return null;
    }
  } else {
    return null;
  }
});


Meteor.publish("allBlueprintsOfGroup", function (groupId: string) {
  if (this.userId) {
    let group: Group = new Group(groupId);
    if (!group.exists()) {
      return null;
    }

    if (group.isCoordinatorById(this.userId) || Roles.userIsInRole(this.userId, ["admin"])) { // Admin darf alle Gruppen sehen
      return Blueprints.find({ group: group.getId() });
    } else {
      return null;
    }
  } else {
    return null;
  }
});







Meteor.publishComposite("singleAssignment", function (assignmentId: string): Meteor.PublishCompositeConfig<AssignmentDAO> {

  check(assignmentId, String);

  let context = <Subscription>this;

  if (!context.userId) {
    return null;
  }



  return {
    find: AssignmentPublication.singleAssignmentAndOtherAssignmentsOnSameDay(this.userId, assignmentId),
    children: [{
      find: (assignment: AssignmentDAO) => {
        let participants = assignment.participants.map((entry) => entry.user);
        let applicants = assignment.applicants.map((entry) => entry.user);
        let contactPersons = assignment.contacts;

        let allUsers = _.union(participants, applicants, contactPersons);

        let fieldsToPublish: Mongo.FieldSpecifier = { "_id": 1, "profile": 1, "emails.address": 1 }; // Profilinfos und E-Mail-Adressen für jeden User sichtbar

        let cursor = Meteor.users.find({ "_id": { "$in": allUsers } }, { fields: fieldsToPublish });
        return cursor;
      }
    }
    ]
  };
});

namespace AssignmentPublication {

  function userHasRightToSeeAssignment(user: User, assignment: Assignment): boolean {
    let group = assignment.getGroup();
    return (group.isMember(user) || user.isGroupCoordinator(group));
  }

  export function singleAssignmentAndOtherAssignmentsOnSameDay(userId: string, assignmentId: string) {
    let assignment = new Assignment(assignmentId);
    let user = new User(userId);

    if (!userHasRightToSeeAssignment(user, assignment)) {
      return null;
    }

    let assignmentDao = Assignments.findOne({ "_id": assignmentId });
    let startOfDay = moment(assignmentDao.start).startOf("day");
    let endOfDay = startOfDay.clone().endOf("day");

    return () => {
      /*
      *  Query: Gibt Details zum gegebenen Assignment und allen anderen Assignments des gleichen Tages.
      *  Die Termine müssen alle den gleichen Namen haben, geschlossen sein und mindestens einen Teilnehmer haben.
      */
      return Assignments.find({
        // ODER-Verknüpfung der folgenden Bedingungen:
        $or: [
          // Die ID entspricht der gegebenen assignmentId
          { "_id": assignmentId },
          /*
          *  Termine einer Gruppe, die am gleichen Tag stattfinden,
          *  müssen alle den gleichen Namen haben, geschlossen sein
          *  und mindestens einen Teilnehmer haben.
          */
          {
            "group": assignmentDao.group,
            "state": AssignmentState[AssignmentState.Closed],
            "name": assignmentDao.name,
            "start": { "$gte": startOfDay.toDate(), "$lt": endOfDay.toDate() },
            "participants": { $exists: true, $not: { $size: 0 } }
          }
        ]
      });
    };
  }
}



Meteor.publish("assignmentsInMonthPerGroup", function (groupId: string, monthYear: string) {
  check(groupId, String);
  check(monthYear, String);

  let group = new Group(groupId);
  let user = new User(this.userId);

  let isValidUser: boolean = !_.isNull(this.userId) && user.exists();
  if (isValidUser && (group.isMember(user) || user.isGroupCoordinator(group))) {
    let date = moment(monthYear, Assignment.MonthStringFormat);

    return Assignments.find({
      group: groupId,
      year: date.year(),
      month: date.month(),
      end: { $gte: moment().startOf("day").toDate() }
    }, {
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
      }
    });
  } else {
    return null;
  }
}, {
  url: "assignmentsInMonthPerGroup/:0/:1",
  httpMethod: "get"
});

// Publish für Tests
if (process.env.IS_MIRROR || process.env.VELOCITY_CI) { // Nur auf Test-Mirror

  Meteor.publish("allAssignmentsForTest", function () {
    if (this.userId) {
      console.log("Publishing all assignments for testing.");
      return Assignments.find();
    }
    else {
      return null;
    }
  });

}



Meteor.publish("groupName", function (id) {
  check(id, String);

  return Groups.find({ "_id": id }, { fields: { "_id": 1, "name": 1 } });
});

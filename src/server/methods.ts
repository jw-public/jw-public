import * as _ from "underscore";
import { app } from "./App";

import { Roles } from "meteor/alanning:roles";
import { check } from "meteor/check";
import { Meteor } from "meteor/meteor";

import { Email } from "meteor/email";
import * as PhoneValidator from "../collections/lib/ValidationFunctions/PhoneValidator";

import Group from "../collections/lib/classes/Group";
import { Groups } from "../collections/lib/GroupCollection";

import User from "../collections/lib/classes/User";
import * as UserCollection from "../collections/lib/UserCollection";


import Assignment from "../collections/lib/classes/Assignment";



Meteor.startup(function () {
  Meteor.methods({
    /**
     * Gesamtzahl aller Nutzer einsehen.
     */
    getAllUsersCount: function (): number {

      if (this.userId && Roles.userIsInRole(this.userId, ["admin"])) {
        return Meteor.users.find({}, { fields: { "_id": 1 } }).count();
      } else {
        return -1;
      }
    },
    /**
     * Gesamtzahl aller Nutzer einer Gruppe einsehen.
     */
    getUsersInGroupCount: function (groupId: string): number {

      check(groupId, String);

      let user: UserCollection.UserDAO = Meteor.users.findOne({ "_id": this.userId }, { fields: { "_id": 1 } });
      let group: Group = Group.createFromId(groupId);

      let hasRight: boolean = this.userId && group.isMemberByDAO(user);

      if (hasRight) {
        return group.getUserCount();
      } else {
        return -1;
      }
    },
    /**
     * Überprüft, ob ein Benutzer mit dem Username oder E-Mail Adresse bereits im System ist.
     * @param username Einen Usernamen oder eine E-Mail-Adresse
     * @returns {boolean} Wenn TRUE, dann existiert der Benutzer bereits.
     */
    userExists: function (username: string): boolean {

      check(username, String);

      return User.userExists(username);
    },
    /**
     * Überprüft, ob eine Gruppe mit gegebener ID im System vorhanden ist.
     * @param groupId Eine ID einer Gruppe
     * @returns {boolean} Wenn TRUE, dann existiert die Gruppe.
     */
    groupExists: function (groupId: string): boolean {

      check(groupId, String);
      // Check if group exists.
      let groupCount = Groups.find({
        "_id": groupId
      }, { fields: { "_id": 1 } }).count();
      return groupCount > 0;
    },
    /**
     * Fügt einen Benutzer zu einer Gruppe hinzu und entfernt die Bewerbung (falls vorhanden).
     * @param userToBeAddedId ID des Benutzers, der hinzugefügt werden soll
     * @param groupId ID der Gruppe, in die der Nutzer eingefügt werden soll
     */
    addToGroup: function (userToBeAddedId: string, groupId: string): void {


      // Checking types of parameters
      check(groupId, String);
      check(userToBeAddedId, String);

      // ### Variables ###

      // User Object, representing the User
      let user: User = new User(this.userId);

      // Group object
      let group: Group = Group.createFromId(groupId);

      // Checking permission
      let hasRight = user.isGroupCoordinator(group) || user.isAdmin();
      if (!hasRight) {
        throw new Meteor.Error("403", "Access denied");
      }

      // Add user to group as member
      group.addUserAsGroupMemberById(userToBeAddedId);
    },

    /**
     * Löscht einen Benutzer einer Gruppe.
     * @param userToDenyId ID des Benutzers, der gelöscht werden soll
     * @param groupId ID der Gruppe, in die sich der Nutzer befindet
     */
    denyUser: function (userToDenyId: string, groupId: string): void {


      // Checking types of parameters
      check(userToDenyId, String);
      check(groupId, String);

      // ### Variables ###

      // User Object, representing the User
      let initiator: User = new User(this.userId);
      let userToDeny: User = new User(userToDenyId);


      let isMemberOfAnyGroup: boolean = userToDeny.getGroupIds(false).length > 0;
      let pendingGroupIds = userToDeny.pendingGroupIdsOnce;
      let isPendingOnGroup: boolean = _.contains(pendingGroupIds, groupId);
      let hasMoreThanOnePendingGroup: boolean = pendingGroupIds.length > 1;

      // Group object
      let group: Group = new Group(groupId);

      // Checking permission
      let hasRight = isPendingOnGroup && (initiator.isGroupCoordinator(group) || initiator.isAdmin());
      if (!hasRight) {
        throw new Meteor.Error("403", "Access denied");
      } else {
        // Denying user
        if (!isMemberOfAnyGroup && !hasMoreThanOnePendingGroup) {
          // Delete record
          Meteor.users.remove({ "_id": userToDenyId });
        } else {
          group.removeUserAsApplicantById(userToDenyId);
        }

      }
    },

    /**
     * Trägt den eingeloggten User als Bewerben in einen Trolley-Einsatz seiner Gruppe ein.
     * @param assignmentId Die ID des Trolleyeinsatzes.
     */
    applyOnAssignment: function (assignmentId: string): void {
      check(assignmentId, String);

      if (!this.userId) {
        throw new Meteor.Error("403", "Access denied.");
      }

      let assignment = new Assignment(assignmentId);
      let group: Group = assignment.getGroup();

      if (group.isMemberById(this.userId) && !assignment.isClosed()) {
        app.assignmentApplicationControllerFactory(assignmentId).addUserAsApplicantById(this.userId);
      } else {
        throw new Meteor.Error("403", "Access denied.");
      }


    },
    /**
     * Zieht die Bewerbung auf einen Trolley-Einsatz des eingeloggten User zurück.
     * @param assignmentId Die ID des Trolleyeinsatzes.
     */
    cancelApplicationAssignment: function (assignmentId: string): void {
      check(assignmentId, String);
      if (!this.userId) {
        throw new Meteor.Error("403", "Access denied.");
      }
      let assignment = new Assignment(assignmentId);
      app.assignmentApplicationControllerFactory(assignmentId).removeUserAsApplicantById(this.userId);

    },
    /**
     * Überprüft, ob User ein Bewerber ist.
     * @param assignmentId Die ID des Trolleyeinsatzes.
     */
    userIsApplicant: function (assignmentId: string): boolean {
      check(assignmentId, String);


      if (!Meteor.user()) {
        throw new Meteor.Error("403", "Access denied.");
      }
      let assignment = new Assignment(assignmentId);
      return assignment.isUserApplicantById(this.userId);

    },
    /**
     * Fügt einen Benutzer als Teilnehmer eines Einsatzes hinzu und löscht die Bewerbung auf diesen (falls vorhanden).
     * @param userToBeAddedId Benutzer, der als Teilnehmer hinzugefügt werden soll.
     * @param assignmentId Die ID des Einsatzes.
     */
    addUserAsAssignmentParticipant: function (userToBeAddedId: string, assignmentId: string): void {

      check(assignmentId, String);
      check(userToBeAddedId, String);
      let userToBeAdded = new User(userToBeAddedId);
      let initiator: User = new User(this.userId);
      let assignment: Assignment = new Assignment(assignmentId);

      let isAdmin = initiator.isAdmin();
      let isGroupCoordinator = initiator.isGroupCoordinator(assignment.getGroup());
      let hasRight = isGroupCoordinator || isAdmin;

      if (!hasRight || !userToBeAdded.exists()) {
        throw new Meteor.Error("403", "Access denied");
      } else {
        app.assignmentParticipantControllerFactory(assignmentId).addUserAsParticipantAndNotify(userToBeAddedId);
      }

    },


    /**
     * Löscht einen User aus einem Einsatz, sowohl als Bewerber als auch Teilnehmer.
     * @param userToBeRemovedId Benutzer, der entfernt werden soll.
     * @param assignmentId Die ID des Einsatzes.
     */
    removeUserAsAssignmentParticipant: function (userToBeRemovedId: string, assignmentId: string): void {

      check(assignmentId, String);
      check(userToBeRemovedId, String);
      let userToBeRemoved = new User(userToBeRemovedId);
      let initiator: User = new User(this.userId);
      let assignment: Assignment = new Assignment(assignmentId);

      let isAdmin = initiator.isAdmin();
      let isGroupCoordinator = initiator.isGroupCoordinator(assignment.getGroup());
      let hasRight = isGroupCoordinator || isAdmin;

      if (!hasRight || !userToBeRemoved.exists()) {
        throw new Meteor.Error("403", "Access denied");
      } else {
        app.assignmentParticipantControllerFactory(assignmentId).removeUserAsParticipantAndNotify(userToBeRemovedId);
      }
    },

    closeAssignment: function (participantIds: Array<string>, assignmentId: string): void {

      check(assignmentId, String);
      check(participantIds, [String]);
      let initiator: User = new User(this.userId);
      let assignment: Assignment = new Assignment(assignmentId);

      let isAdmin = initiator.isAdmin();
      let isGroupCoordinator = initiator.isGroupCoordinator(assignment.getGroup());
      let hasRight = isGroupCoordinator || isAdmin;

      if (!hasRight) {
        throw new Meteor.Error("403", "Access denied");
      } else {
        app.assignmentCloser.closeAssignment({
          assignmentId,
          participantIds
        });
      }
    },
    cancelAssignment: function (assignmentId: string, reason: string): void {

      check(assignmentId, String);
      check(reason, String);
      let initiator: User = new User(this.userId);
      let assignment: Assignment = new Assignment(assignmentId);

      let isAdmin = initiator.isAdmin();
      let isGroupCoordinator = initiator.isGroupCoordinator(assignment.getGroup());
      let hasRight = isGroupCoordinator || isAdmin;

      if (!hasRight) {
        throw new Meteor.Error("403", "Access denied");
      } else {
        app.assignmentCanceler.cancelAssignment(assignmentId, reason);
      }
    },
    reenableAssignment: function (assignmentId: string, reason: string): void {

      check(assignmentId, String);
      check(reason, String);
      let initiator: User = new User(this.userId);
      let assignment: Assignment = new Assignment(assignmentId);

      let isAdmin = initiator.isAdmin();
      let isGroupCoordinator = initiator.isGroupCoordinator(assignment.getGroup());
      let hasRight = isGroupCoordinator || isAdmin;

      if (!hasRight) {
        throw new Meteor.Error("403", "Access denied");
      } else {
        app.assignmentReenabler.reenableAssignment(assignmentId, reason);
      }
    },
    removeAssignment: function (assignmentId: string): void {

      check(assignmentId, String);
      let initiator: User = new User(this.userId);
      let assignment: Assignment = new Assignment(assignmentId);

      let isAdmin = initiator.isAdmin();
      let isGroupCoordinator = initiator.isGroupCoordinator(assignment.getGroup());
      let hasRight = isGroupCoordinator || isAdmin;

      if (!hasRight) {
        throw new Meteor.Error("403", "Access denied");
      } else {
        app.assignmentRemover.removeAssignment(assignmentId);
      }
    },

    sendEmail: function (to: string, from: string, subject: string, text: string): void {
      check([to, from, subject, text], [String]);

      let initiator: User = new User(this.userId);

      if (initiator.isAdmin()) {
        Email.send({
          to: to,
          from: from,
          subject: subject,
          text: text
        });
      }
    },

    copyAssignmentWeek: function (
      groupId: string,
      fromIsoWeek: number,
      fromIsoYear: number,
      toIsoWeek: number,
      toIsoYear: number): number {
      check([groupId], [String]);
      check([fromIsoWeek, toIsoWeek, fromIsoYear, toIsoYear], [Number]);

      let initiator: User = new User(this.userId);
      let group: Group = new Group(groupId);

      if (group.isCoordinator(initiator)) {
        return app.assignmentWeekCopyPaster.copyPasteCalendarWeekInGroup({
          groupId: groupId,
          from: {
            calendarWeek: fromIsoWeek,
            year: fromIsoYear
          },
          to: {
            calendarWeek: toIsoWeek,
            year: toIsoYear
          }
        })
      }
      throw new Meteor.Error("403", "Access denied");
    },

    validatePhoneNumber: function (phoneNumber: string): boolean {
      return PhoneValidator.isValidNumber(phoneNumber);
    },

    /**
     * Löscht einen Benutzer ohne Rücksicht auf Mitgliedschaft, außer er ist ein Administrator
     * @param userToRemoveId ID des Benutzers, der gelöscht werden soll
     */
    removeUser: function (userToRemoveId: string): void {


      // Checking types of parameters
      check(userToRemoveId, String);

      // ### Variables ###
      // User Object, representing the User
      let initiator: User = new User(this.userId);
      let userToRemove: User = new User(userToRemoveId);

      // Checking permission
      let hasRight = initiator.isAdmin();
      let isUserToRemoveAnAdmin = userToRemove.isAdmin();
      //
      if (hasRight && !isUserToRemoveAnAdmin) {
        // Remove user
        console.error(userToRemoveId);
        Meteor.users.remove({ "_id": userToRemoveId });
      } else {
        throw new Meteor.Error("403", "Access denied");
      }
    }

  });
});

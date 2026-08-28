import * as _ from "underscore";
import { app } from "./App";

import { Roles } from "meteor/alanning:roles";
import { MethodImplementations } from "../imports/methods/MethodContracts";
import * as RolesHelper from "../lib/RolesHelper";
import { check } from "meteor/check";
import { Meteor } from "meteor/meteor";
import { Random } from "meteor/random";

import { Email } from "meteor/email";
import * as PhoneValidator from "../collections/lib/ValidationFunctions/PhoneValidator";

import { GroupDAO, Groups } from "../collections/lib/GroupCollection";
import { AssignmentDAO, Assignments } from "../collections/lib/AssignmentsCollection";
import { AssignmentState } from "../collections/lib/classes/AssignmentState";
import { Notifications } from "../collections/lib/NotificationCollection";
import * as UserNotification from "../collections/lib/classes/UserNotification";
import * as UserCollection from "../collections/lib/UserCollection";
import { TERMS_OF_USE_VERSION } from "../imports/terms/TermsOfUse";
import { computeInactivityReport, computeUserActivity } from "../imports/cleanup/InactivityReport";
import { buildUsageReport, recentMonths } from "../imports/statistics/UsageReport";
import { UserExportRow } from "../imports/statistics/UserExport";
import { Blueprints } from "../collections/lib/BlueprintCollection";
import { AssignmentCopyActions } from "../collections/lib/AssignmentCopyActionsCollection";

// --- Async access helpers (the isomorphic domain classes are sync and
// therefore client-only since Meteor 3) -------------------------------------

async function getGroupDoc(groupId: string): Promise<GroupDAO | undefined> {
  return await Groups.findOneAsync({ _id: groupId });
}

async function getAssignmentDoc(assignmentId: string): Promise<AssignmentDAO | undefined> {
  return await Assignments.findOneAsync({ _id: assignmentId });
}

function isCoordinatorOf(group: GroupDAO | undefined, userId: string | null): boolean {
  return !!group && _.contains(group.coordinators || [], userId);
}

async function isMemberOf(groupId: string, userId: string): Promise<boolean> {
  if (!groupId || !userId) {
    return false;
  }
  const member = await Meteor.users.findOneAsync(
    { _id: userId, groups: { $in: [groupId] } },
    { fields: { _id: 1 } },
  );
  return !!member;
}

async function requireCoordinatorOrAdmin(userId: string | null, groupId: string): Promise<void> {
  const group = await getGroupDoc(groupId);
  const hasRight = isCoordinatorOf(group, userId) || (await RolesHelper.userIsAdminAsync(userId));
  if (!hasRight) {
    throw new Meteor.Error("403", "Access denied");
  }
}

Meteor.startup(function () {
  // Typed against the shared wire contract: signature drift between client
  // and server is a compile error here, not a runtime surprise.
  const methods: MethodImplementations = {
    /**
     * Rollen eines Users setzen (roles v4: Zuweisungen liegen nicht mehr am
     * User-Dokument, daher kein Client-Update mehr möglich).
     */
    adminSetUserRoles: async function (targetUserId: string, roles: string[]): Promise<void> {
      check(targetUserId, String);
      check(roles, [String]);

      if (!this.userId || !(await RolesHelper.userIsAdminAsync(this.userId))) {
        throw new Meteor.Error(403, "Zugriff verweigert.");
      }

      for (const r of roles) {
        await Roles.createRoleAsync(r, { unlessExists: true });
      }
      await Roles.setUserRolesAsync(targetUserId, roles);
    },
    /**
     * Gesamtzahl aller Nutzer einsehen.
     */
    getAllUsersCount: async function (): Promise<number> {
      if (this.userId && (await RolesHelper.userIsAdminAsync(this.userId))) {
        return await Meteor.users.find({}, { fields: { _id: 1 } }).countAsync();
      } else {
        return -1;
      }
    },
    /**
     * Gesamtzahl aller Nutzer einer Gruppe einsehen.
     */
    getUsersInGroupCount: async function (groupId: string): Promise<number> {
      check(groupId, String);

      const hasRight = this.userId && (await isMemberOf(groupId, this.userId));

      if (hasRight) {
        return await Meteor.users
          .find({ groups: { $in: [groupId] } }, { fields: { _id: 1 } })
          .countAsync();
      } else {
        return -1;
      }
    },
    /**
     * Überprüft, ob ein Benutzer mit dem Username oder E-Mail Adresse bereits im System ist.
     * @param username Einen Usernamen oder eine E-Mail-Adresse
     * @returns {boolean} Wenn TRUE, dann existiert der Benutzer bereits.
     */
    userExists: async function (username: string): Promise<boolean> {
      check(username, String);

      const userCount = await UserCollection.users
        .find(
          {
            $or: [
              {
                username: username,
              },
              {
                "emails.address": username,
              },
            ],
          },
          { fields: { _id: 1 } },
        )
        .countAsync();
      return userCount > 0;
    },
    /**
     * Überprüft, ob eine Gruppe mit gegebener ID im System vorhanden ist.
     * @param groupId Eine ID einer Gruppe
     * @returns {boolean} Wenn TRUE, dann existiert die Gruppe.
     */
    groupExists: async function (groupId: string): Promise<boolean> {
      check(groupId, String);
      const groupCount = await Groups.find(
        {
          _id: groupId,
        },
        { fields: { _id: 1 } },
      ).countAsync();
      return groupCount > 0;
    },
    /**
     * Fügt einen Benutzer zu einer Gruppe hinzu und entfernt die Bewerbung (falls vorhanden).
     * @param userToBeAddedId ID des Benutzers, der hinzugefügt werden soll
     * @param groupId ID der Gruppe, in die der Nutzer eingefügt werden soll
     */
    addToGroup: async function (userToBeAddedId: string, groupId: string): Promise<void> {
      // Checking types of parameters
      check(groupId, String);
      check(userToBeAddedId, String);

      await requireCoordinatorOrAdmin(this.userId, groupId);

      const group = await getGroupDoc(groupId);
      if (!group) {
        throw new Meteor.Error("404", "Group not found");
      }
      const userToBeAdded = await Meteor.users.findOneAsync(
        { _id: userToBeAddedId },
        { fields: { _id: 1, groups: 1, emails: 1 } },
      );

      const isAlreadyMember =
        !!userToBeAdded && _.contains((userToBeAdded as any).groups || [], groupId);
      if (!userToBeAdded || isAlreadyMember) {
        console.warn("Failed to add user " + userToBeAddedId + " to group " + group.name);
        return;
      }

      await Meteor.users.updateAsync(
        { _id: userToBeAddedId },
        {
          $pull: { "profile.pendingGroups": groupId },
          $push: { groups: groupId },
        },
      );

      console.log("Added user " + userToBeAddedId + " to group " + group.name);

      // Willkommens-Benachrichtigung (war User.notificationManager.notify)
      await Notifications.insertAsync({
        type: UserNotification.Type[UserNotification.Type.Simple],
        userId: userToBeAddedId,
        simpleData: {
          title: "Willkommen!",
          details: "Herzlich Willkommen in der Gruppe " + group.name + ".",
          icon: "fa fa-thumbs-o-up faa-bounce animated-hover",
          hasLink: false,
        },
      });
    },

    /**
     * Löscht einen Benutzer einer Gruppe.
     * @param userToDenyId ID des Benutzers, der gelöscht werden soll
     * @param groupId ID der Gruppe, in die sich der Nutzer befindet
     */
    denyUser: async function (userToDenyId: string, groupId: string): Promise<void> {
      // Checking types of parameters
      check(userToDenyId, String);
      check(groupId, String);

      const userToDeny = (await Meteor.users.findOneAsync(
        { _id: userToDenyId },
        { fields: { groups: 1, "profile.pendingGroups": 1 } },
      )) as any;

      if (!userToDeny) {
        throw new Meteor.Error("404", "User not found");
      }

      const pendingGroupIds: string[] =
        (userToDeny.profile && userToDeny.profile.pendingGroups) || [];
      const isMemberOfAnyGroup = (userToDeny.groups || []).length > 0;
      const isPendingOnGroup = _.contains(pendingGroupIds, groupId);
      const hasMoreThanOnePendingGroup = pendingGroupIds.length > 1;

      const group = await getGroupDoc(groupId);
      const hasRight =
        isPendingOnGroup &&
        (isCoordinatorOf(group, this.userId) || (await RolesHelper.userIsAdminAsync(this.userId)));
      if (!hasRight) {
        throw new Meteor.Error("403", "Access denied");
      }

      if (!isMemberOfAnyGroup && !hasMoreThanOnePendingGroup) {
        // Delete record
        await Meteor.users.removeAsync({ _id: userToDenyId });
      } else {
        await Meteor.users.updateAsync(
          { _id: userToDenyId },
          {
            $pull: { "profile.pendingGroups": groupId },
          },
        );
      }
    },

    /**
     * Trägt den eingeloggten User als Bewerben in einen Trolley-Einsatz seiner Gruppe ein.
     * @param assignmentId Die ID des Trolleyeinsatzes.
     */
    applyOnAssignment: async function (assignmentId: string): Promise<void> {
      check(assignmentId, String);

      if (!this.userId) {
        throw new Meteor.Error("403", "Access denied.");
      }

      const assignment = await getAssignmentDoc(assignmentId);
      if (!assignment) {
        throw new Meteor.Error("404", "Assignment not found.");
      }
      const isClosed = assignment.state === AssignmentState[AssignmentState.Closed];

      if ((await isMemberOf(assignment.group, this.userId)) && !isClosed) {
        await app
          .assignmentApplicationControllerFactory(assignmentId)
          .addUserAsApplicantById(this.userId);

        // Koordinatoren informieren, falls dieser Termin durch die Bewerbung
        // gerade voll geworden ist (In-App + Mail, je nach deren
        // Self-Service-Einstellung). Der Vorher-Wert stammt aus dem Dokument,
        // das oben schon geladen wurde — der Vergleich mit dem Nachher-Zustand
        // erkennt den Übergang, ohne dass ein Stempel am Termin nötig wäre
        // (ADR 0006). Fehler hier dürfen die bereits gespeicherte Bewerbung
        // nicht rückwirkend scheitern lassen.
        const totalUsersBefore =
          (assignment.applicants ?? []).length + (assignment.participants ?? []).length;
        try {
          await app.assignmentFullNotifier.notifyCoordinatorsIfAssignmentBecameFull(
            assignmentId,
            totalUsersBefore,
          );
        } catch (error) {
          console.error("Failed to notify coordinators about full assignment:", error);
        }
      } else {
        throw new Meteor.Error("403", "Access denied.");
      }
    },
    /**
     * Zieht die Bewerbung auf einen Trolley-Einsatz des eingeloggten User zurück.
     * @param assignmentId Die ID des Trolleyeinsatzes.
     */
    cancelApplicationAssignment: async function (assignmentId: string): Promise<void> {
      check(assignmentId, String);
      if (!this.userId) {
        throw new Meteor.Error("403", "Access denied.");
      }
      await app
        .assignmentApplicationControllerFactory(assignmentId)
        .removeUserAsApplicantById(this.userId);
    },
    /**
     * Überprüft, ob User ein Bewerber ist.
     * @param assignmentId Die ID des Trolleyeinsatzes.
     */
    userIsApplicant: async function (assignmentId: string): Promise<boolean> {
      check(assignmentId, String);

      if (!this.userId) {
        throw new Meteor.Error("403", "Access denied.");
      }
      const assignment = await getAssignmentDoc(assignmentId);
      return (
        !!assignment &&
        _.some(assignment.applicants || [], (entry: any) => entry.user === this.userId)
      );
    },
    /**
     * Fügt einen Benutzer als Teilnehmer eines Einsatzes hinzu und löscht die Bewerbung auf diesen (falls vorhanden).
     * @param userToBeAddedId Benutzer, der als Teilnehmer hinzugefügt werden soll.
     * @param assignmentId Die ID des Einsatzes.
     */
    addUserAsAssignmentParticipant: async function (
      userToBeAddedId: string,
      assignmentId: string,
    ): Promise<void> {
      check(assignmentId, String);
      check(userToBeAddedId, String);

      const assignment = await getAssignmentDoc(assignmentId);
      if (!assignment) {
        throw new Meteor.Error("404", "Assignment not found.");
      }
      await requireCoordinatorOrAdmin(this.userId, assignment.group);

      const userToBeAdded = await Meteor.users.findOneAsync(
        { _id: userToBeAddedId },
        { fields: { _id: 1 } },
      );
      if (!userToBeAdded) {
        throw new Meteor.Error("403", "Access denied");
      }
      await app
        .assignmentParticipantControllerFactory(assignmentId)
        .addUserAsParticipantAndNotify(userToBeAddedId);
    },

    /**
     * Löscht einen User aus einem Einsatz, sowohl als Bewerber als auch Teilnehmer.
     * @param userToBeRemovedId Benutzer, der entfernt werden soll.
     * @param assignmentId Die ID des Einsatzes.
     */
    removeUserAsAssignmentParticipant: async function (
      userToBeRemovedId: string,
      assignmentId: string,
    ): Promise<void> {
      check(assignmentId, String);
      check(userToBeRemovedId, String);

      const assignment = await getAssignmentDoc(assignmentId);
      if (!assignment) {
        throw new Meteor.Error("404", "Assignment not found.");
      }
      await requireCoordinatorOrAdmin(this.userId, assignment.group);

      const userToBeRemoved = await Meteor.users.findOneAsync(
        { _id: userToBeRemovedId },
        { fields: { _id: 1 } },
      );
      if (!userToBeRemoved) {
        throw new Meteor.Error("403", "Access denied");
      }
      await app
        .assignmentParticipantControllerFactory(assignmentId)
        .removeUserAsParticipantAndNotify(userToBeRemovedId);
    },

    closeAssignment: async function (
      participantIds: Array<string>,
      assignmentId: string,
    ): Promise<void> {
      check(assignmentId, String);
      check(participantIds, [String]);

      const assignment = await getAssignmentDoc(assignmentId);
      if (!assignment) {
        throw new Meteor.Error("404", "Assignment not found.");
      }
      await requireCoordinatorOrAdmin(this.userId, assignment.group);

      await app.assignmentCloser.closeAssignment({
        assignmentId,
        participantIds,
      });
    },
    cancelAssignment: async function (assignmentId: string, reason: string): Promise<void> {
      check(assignmentId, String);
      check(reason, String);

      const assignment = await getAssignmentDoc(assignmentId);
      if (!assignment) {
        throw new Meteor.Error("404", "Assignment not found.");
      }
      await requireCoordinatorOrAdmin(this.userId, assignment.group);

      await app.assignmentCanceler.cancelAssignment(assignmentId, reason);
    },
    reenableAssignment: async function (assignmentId: string, reason: string): Promise<void> {
      check(assignmentId, String);
      check(reason, String);

      const assignment = await getAssignmentDoc(assignmentId);
      if (!assignment) {
        throw new Meteor.Error("404", "Assignment not found.");
      }
      await requireCoordinatorOrAdmin(this.userId, assignment.group);

      await app.assignmentReenabler.reenableAssignment(assignmentId, reason);
    },
    removeAssignment: async function (assignmentId: string): Promise<void> {
      check(assignmentId, String);

      const assignment = await getAssignmentDoc(assignmentId);
      if (!assignment) {
        throw new Meteor.Error("404", "Assignment not found.");
      }
      await requireCoordinatorOrAdmin(this.userId, assignment.group);

      await app.assignmentRemover.removeAssignment(assignmentId);
    },

    sendEmail: async function (
      to: string,
      from: string,
      subject: string,
      text: string,
    ): Promise<void> {
      check([to, from, subject, text], [String]);

      if (await RolesHelper.userIsAdminAsync(this.userId)) {
        Email.send({
          to: to,
          from: from,
          subject: subject,
          text: text,
        });
      }
    },

    copyAssignmentWeek: async function (
      groupId: string,
      fromIsoWeek: number,
      fromIsoYear: number,
      toIsoWeek: number,
      toIsoYear: number,
    ): Promise<number> {
      check([groupId], [String]);
      check([fromIsoWeek, toIsoWeek, fromIsoYear, toIsoYear], [Number]);

      const group = await getGroupDoc(groupId);
      if (isCoordinatorOf(group, this.userId)) {
        return await app.assignmentWeekCopyPaster.copyPasteCalendarWeekInGroup({
          groupId: groupId,
          from: {
            calendarWeek: fromIsoWeek,
            year: fromIsoYear,
          },
          to: {
            calendarWeek: toIsoWeek,
            year: toIsoYear,
          },
        });
      }
      throw new Meteor.Error("403", "Access denied");
    },

    validatePhoneNumber: function (phoneNumber: string): boolean {
      return PhoneValidator.isValidNumber(phoneNumber);
    },

    /**
     * Löscht einen Benutzer ohne Rücksicht auf Mitgliedschaft, außer er ist ein
     * Administrator. Räumt zugehörige Daten mit ab (Datenminimierung):
     * Benachrichtigungen sowie Teilnahme-/Bewerbungs-Einträge in Terminen.
     * @param userToRemoveId ID des Benutzers, der gelöscht werden soll
     */
    removeUser: async function (userToRemoveId: string): Promise<void> {
      // Checking types of parameters
      check(userToRemoveId, String);

      const hasRight = await RolesHelper.userIsAdminAsync(this.userId);
      const isUserToRemoveAnAdmin = await RolesHelper.userIsAdminAsync(userToRemoveId);

      if (hasRight && !isUserToRemoveAnAdmin) {
        console.log("Removing user " + userToRemoveId + " (by " + this.userId + ")");
        await Meteor.users.removeAsync({ _id: userToRemoveId });
        await Notifications.removeAsync({ userId: userToRemoveId });
        // rawCollection: the schema's updatedAt autoValue must not re-stamp
        // tens of thousands of historical assignments, and contacts (minCount
        // 1) stay untouched.
        await Assignments.rawCollection().updateMany(
          {
            $or: [{ "participants.user": userToRemoveId }, { "applicants.user": userToRemoveId }],
          },
          {
            $pull: {
              participants: { user: userToRemoveId },
              applicants: { user: userToRemoveId },
            } as any,
          },
        );
      } else {
        throw new Meteor.Error("403", "Access denied");
      }
    },

    /**
     * Inaktivitäts-Report für die Aufräumen-Seite: Gruppen ohne Termine und
     * Benutzer ohne Login/Aktivität seit dem Schwellwert.
     */
    adminInactivityReport: async function (thresholdDays: number) {
      check(thresholdDays, Number);
      if (!(await RolesHelper.userIsAdminAsync(this.userId))) {
        throw new Meteor.Error("403", "Access denied");
      }

      const [users, groups, assignments, adminAssignments] = await Promise.all([
        Meteor.users
          .find(
            {},
            {
              fields: {
                createdAt: 1,
                updatedAt: 1,
                "profile.first_name": 1,
                "profile.last_name": 1,
                "profile.pendingGroups": 1,
                "emails.address": 1,
                groups: 1,
                "services.resume.loginTokens.when": 1,
              },
            },
          )
          .fetchAsync(),
        Groups.find({}, { fields: { name: 1, createdAt: 1, updatedAt: 1 } }).fetchAsync(),
        Assignments.find(
          {},
          {
            fields: {
              group: 1,
              start: 1,
              "participants.user": 1,
              "participants.when": 1,
              "applicants.user": 1,
              "applicants.when": 1,
            },
          },
        ).fetchAsync(),
        Meteor.roleAssignment.find({ "role._id": "admin" }).fetchAsync(),
      ]);

      return computeInactivityReport({
        users: users as any,
        groups: groups as any,
        assignments: assignments as any,
        adminIds: adminAssignments.map((a: any) => a.user._id),
        thresholdDays,
        now: new Date(),
      });
    },

    /**
     * Löscht eine Gruppe MITSAMT ihrer Termine, Blueprints und Kopieraktionen
     * und entfernt Mitgliedschaften/Bewerbungen der Nutzer auf diese Gruppe.
     */
    adminDeleteGroup: async function (groupId: string) {
      check(groupId, String);
      if (!(await RolesHelper.userIsAdminAsync(this.userId))) {
        throw new Meteor.Error("403", "Access denied");
      }
      const group = await getGroupDoc(groupId);
      if (!group) {
        throw new Meteor.Error("404", "Group not found");
      }

      const removedAssignments = await Assignments.removeAsync({ group: groupId });
      await Blueprints.removeAsync({ group: groupId } as any);
      await AssignmentCopyActions.removeAsync({ group: groupId });
      // rawCollection: membership pulls must not re-stamp updatedAt (it feeds
      // the user-inactivity signal).
      await Meteor.users
        .rawCollection()
        .updateMany(
          { $or: [{ groups: groupId }, { "profile.pendingGroups": groupId }] },
          { $pull: { groups: groupId, "profile.pendingGroups": groupId } as any },
        );
      await Groups.removeAsync({ _id: groupId });
      console.log(
        `Deleted group ${group.name} (${groupId}) with ${removedAssignments} assignments (by ${this.userId})`,
      );
      return { removedAssignments };
    },

    /**
     * Liefert den geheimen Token des persönlichen iCal-Kalenderabos des
     * eingeloggten Users und erzeugt ihn beim ersten Aufruf. Der Token wird
     * bewusst nie publiziert — nur wer ihn kennt, kann den Feed lesen.
     */
    getCalendarToken: async function (): Promise<string> {
      if (!this.userId) {
        throw new Meteor.Error("403", "Access denied");
      }
      const user = (await Meteor.users.findOneAsync(
        { _id: this.userId },
        { fields: { calendarToken: 1 } },
      )) as UserCollection.UserDAO | undefined;
      if (user?.calendarToken) {
        return user.calendarToken;
      }
      // Nur setzen, wenn noch keiner existiert (Guard gegen parallele Calls);
      // danach autoritativ zurücklesen.
      await Meteor.users.updateAsync(
        { _id: this.userId, calendarToken: { $exists: false } },
        { $set: { calendarToken: Random.hexString(40) } },
      );
      const after = (await Meteor.users.findOneAsync(
        { _id: this.userId },
        { fields: { calendarToken: 1 } },
      )) as UserCollection.UserDAO | undefined;
      return after!.calendarToken!;
    },

    /**
     * Erzeugt einen neuen Kalender-Abo-Token (macht den alten Feed-Link
     * ungültig — z.B. wenn er versehentlich geteilt wurde).
     */
    resetCalendarToken: async function (): Promise<string> {
      if (!this.userId) {
        throw new Meteor.Error("403", "Access denied");
      }
      const token = Random.hexString(40);
      await Meteor.users.updateAsync({ _id: this.userId }, { $set: { calendarToken: token } });
      return token;
    },

    /**
     * Kennzahlen für das Admin-Dashboard "Statistik": Besetzungsgrad,
     * Abschlussquote, Termine je Zustand und Teilnahmen — je Gruppe und Monat
     * über die letzten `monthCount` Monate.
     *
     * Aggregiert wird auf dem Server: eine Publication müsste sämtliche
     * Termine eines Jahres an den Client schicken, obwohl davon nur Summen
     * gebraucht werden.
     */
    adminUsageReport: async function (monthCount: number) {
      check(monthCount, Number);
      if (!(await RolesHelper.userIsAdminAsync(this.userId))) {
        throw new Meteor.Error("403", "Access denied");
      }
      if (monthCount < 1 || monthCount > 36) {
        throw new Meteor.Error("400", "monthCount must be between 1 and 36");
      }

      const months = recentMonths(monthCount);
      const now = new Date();
      // Erster Tag des ältesten berichteten Monats.
      const since = new Date(now.getFullYear(), now.getMonth() - (monthCount - 1), 1);

      const [groups, assignments] = await Promise.all([
        Groups.find({}, { fields: { name: 1 }, sort: { name: 1 } }).fetchAsync(),
        Assignments.find(
          { start: { $gte: since } },
          {
            fields: {
              group: 1,
              start: 1,
              state: 1,
              userGoal: 1,
              "participants.user": 1,
              "applicants.user": 1,
            },
          },
        ).fetchAsync(),
      ]);

      return buildUsageReport({
        months,
        groups: groups.map((g) => ({ _id: g._id!, name: g.name })),
        assignments: assignments as any,
      });
    },

    /**
     * Zeilen für den CSV-Export der Benutzer. Die Datei selbst baut der Client
     * (imports/statistics/UserExport), damit der Download ohne zusätzlichen
     * HTTP-Endpunkt und ohne zweites Berechtigungsmodell auskommt.
     *
     * "Letzte Anmeldung" stammt wie im Inaktivitäts-Report aus den
     * Login-Tokens und darf leer sein — Meteor löscht abgelaufene Tokens.
     * "Letzte Aktivität" ist der belastbare Wert daneben.
     */
    adminUserExport: async function (): Promise<UserExportRow[]> {
      if (!(await RolesHelper.userIsAdminAsync(this.userId))) {
        throw new Meteor.Error("403", "Access denied");
      }

      const [users, groups, assignments] = await Promise.all([
        Meteor.users
          .find(
            {},
            {
              fields: {
                createdAt: 1,
                updatedAt: 1,
                "profile.first_name": 1,
                "profile.last_name": 1,
                "profile.pendingGroups": 1,
                "emails.address": 1,
                groups: 1,
                "services.resume.loginTokens.when": 1,
              },
            },
          )
          .fetchAsync(),
        Groups.find({}, { fields: { name: 1 } }).fetchAsync(),
        Assignments.find(
          {},
          {
            fields: {
              group: 1,
              start: 1,
              "participants.user": 1,
              "participants.when": 1,
              "applicants.user": 1,
              "applicants.when": 1,
            },
          },
        ).fetchAsync(),
      ]);

      // Dieselbe Herleitung wie auf der Aufräumen-Seite, damit beide Ansichten
      // nicht unterschiedliche Zahlen für denselben Benutzer zeigen.
      const activityById = computeUserActivity({
        users: users as any,
        assignments: assignments as any,
      });
      const groupNameById = new Map(groups.map((g) => [g._id!, g.name]));

      return (users as any[])
        .map((user) => {
          const activity = activityById.get(user._id);
          return {
            lastName: user.profile?.last_name ?? "",
            firstName: user.profile?.first_name ?? "",
            email: user.emails?.[0]?.address ?? "",
            groupNames: (user.groups ?? [])
              .map((id: string) => groupNameById.get(id))
              .filter((name: string | undefined): name is string => !!name),
            lastLogin: activity?.lastLogin ?? null,
            lastActivity: activity?.lastActivity ?? null,
          };
        })
        .sort(
          (a, b) =>
            a.lastName.localeCompare(b.lastName, "de") ||
            a.firstName.localeCompare(b.firstName, "de"),
        );
    },

    /**
     * Stempelt die Zustimmung des eingeloggten Users zur aktuellen Version
     * der Nutzungsbedingungen (Login-Consent-Gate für Bestandskonten).
     */
    acceptTermsOfUse: async function (): Promise<void> {
      if (!this.userId) {
        throw new Meteor.Error("403", "Access denied");
      }
      await Meteor.users.updateAsync(
        { _id: this.userId },
        {
          $set: {
            termsOfUse: {
              version: TERMS_OF_USE_VERSION,
              acceptedAt: new Date(),
            },
          },
        },
      );
    },
  };

  Meteor.methods(methods);
});

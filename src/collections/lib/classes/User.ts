import * as _ from "underscore";
import {AssignmentEventType} from "../../../imports/assignments/interfaces/AssignmentEventType";
import Group from "./Group";

import Assignment from "./Assignment";
import {Meteor} from "meteor/meteor";
import {Mongo} from "meteor/mongo";
import {Roles} from "meteor/alanning:roles";

import * as UserCollection from "../UserCollection";
import * as UserNotification from "./UserNotification";


import {Groups, GroupDAO} from "../GroupCollection";
import {Notifications} from "../NotificationCollection";
import {UserEntry, AssignmentDAO, Assignments} from "../AssignmentsCollection";


/**
 * Diese Klasse stellt zusätzliche Funktionen für den Benutzer zur Verfügung.
 */
export default class User {
  private id: string;
  private _notificationManager: UserNotificationManager;
  /**
   * Überprüft, ob ein Benutzer mit dem Username oder E-Mail Adresse bereits im System ist.
   * @param username Einen Usernamen oder eine E-Mail-Adresse
   * @returns {boolean} Wenn TRUE, dann existiert der Benutzer bereits.
   */
  public static userExists(username: string): boolean {
    // Check if user exists.
    let userCount = UserCollection.users.find({
      "$or": [{
        "username": username
      }, {
          "emails.address": username
        }]
    }, { fields: { "_id": 1 } }).count();
    return userCount > 0;
  }

  public static createFromEmail(email: string): User {
    if (!User.userExists(email)) {
      throw new Meteor.Error("404", "User \"" + email + "\" not found.");
    }

    let id = UserCollection.users.findOne({
      "emails.address": email
    }, { fields: { "_id": 1 } })._id;

    return User.createFromId(id);
  }

  public static current(): User {
    let userId: string = Meteor.userId();
    let notLoggedIn: boolean = !userId;

    if (notLoggedIn) {
      return null;
    } else {
      return User.createFromId(Meteor.userId());
    }

  }

  public static createFromDAO(dao: Meteor.User | UserCollection.UserDAO): User {
    return new User(dao._id);
  }

  public static createFromId(id: string): User {
    return new User(id);
  }

  /**
   * Konstruktor.
   * @param id Die ID des Users.
   */
  constructor(id: string) {
    this.id = id;
    this._notificationManager = null;
  }

  /**
   * Gibt die ID des Users.
   * @returns {string} Die ID des Users.
   */
  public getId(): string {
    return this.id;
  }

  /**
   * Gibt ein DAO des Users.
   * @returns Das DAO des Users.
   */
  public getDAO(fields?: Mongo.FieldSpecifier, reactive?: boolean) {
    let options;

    if (!reactive) {
      reactive = false;
    }

    if (fields) {
      options = { "fields": fields, "reactive": reactive };
    }

    return UserCollection.users.findOne({ _id: this.id }, options);
  }

  /**
   * Gibt die IDs der Gruppen des Users.
   * @returns {string}
   */
  public getGroupIds(reactive?: boolean): Array<string> {
    if (!reactive) {
      reactive = false;
    }

    return UserCollection.users.findOne({ _id: this.id }, { fields: { _id: 1, groups: 1 }, reactive }).groups;
  }

  public getGroupIdsReactive(): Array<string> {
    return this.getGroupIds(true);
  }

  public getAssignmentsParticipatedCount(reactive?: boolean): number {
    return Assignments.find({ "participants.user": this.id }, {reactive}).count();
  }

  /**
   * Überprüft auf Gleichheit.
   * @param other Zu vergleichender Einsatz.
   * @return {boolean} True, wenn gleich.
   */
  public equals(other: User): boolean {
    return other.getId() === this.getId();
  }

  public isAdmin(): boolean {
    return Roles.userIsInRole(this.id, ['admin']);
  }

  public isGroupCoordinator(group: Group, reactive?: boolean): boolean {
    return group.isCoordinatorById(this.id, reactive);
  }

  public exists(reactive?: boolean): boolean {
    if (!reactive) {
      reactive = false;
    }

    let userCount = UserCollection.users.find({
      _id: this.id
    }, { fields: { "_id": 1 }, "reactive": reactive }).count();
    return userCount > 0;
  }

  public isCoordinatorInAnyGroup(reactive?: boolean): boolean {
    if (!reactive) {
      reactive = false;
    }


    let coordinatingGroupsCursor: Mongo.Cursor<GroupDAO> = Groups.find(
      {
        coordinators: { $in: [this.id] }
      }
      , { fields: { '_id': 1 }, reactive: reactive });

    /**
     * Bestimmt, ob der User in irgendeiner Gruppe ein Koordinator ist.
     * @type {boolean}
     */
    let isCoordinatorInAnyGroup: boolean = coordinatingGroupsCursor.count() > 0;

    return isCoordinatorInAnyGroup;
  }

  get notificationManager(): UserNotificationManager {
    if (_.isNull(this._notificationManager)) {
      this._notificationManager = new UserNotificationManager(this);
    }
    return this._notificationManager;
  }

  get fullName(): string {
    let userDAO = this.getDAO({ "profile.first_name": 1, "profile.last_name": 1 });
    let firstName = userDAO.profile.first_name;
    let lastName = userDAO.profile.last_name;

    if (!_.isUndefined(userDAO)) {
      return `${firstName} ${lastName}`;
    } else {
      return null;
    }
  }

  get carMostlyAvailable(): boolean {
    let userDAO = this.getDAO({ "profile.carMostlyAvailable": 1 });

    if (!_.isUndefined(userDAO)) {
      return userDAO.profile.carMostlyAvailable;
    } else {
      return false;
    }
  }

  get pioneer(): boolean {
    let userDAO: UserCollection.UserDAO = this.getDAO({ "profile.pioneer": 1 });

    if (!_.isUndefined(userDAO)) {
      return userDAO.profile.pioneer;
    } else {
      return false;
    }
  }

  get email(): string {
    let userDAO: UserCollection.UserDAO = this.getDAO({ "emails.address": 1 });

    if (!_.isUndefined(userDAO)) {
      return userDAO.emails[0].address;
    } else {
      return null;
    }
  }

  get mobilePhone(): string {

    let userDAO: UserCollection.UserDAO = this.getDAO({ "profile.mobileNat": 1 });

    if (!_.isUndefined(userDAO)) {
      let profile = userDAO.profile;
      return profile.mobileNat;
    } else {
      return null;
    }
  }

  get formattedMobilePhone(): string {
    let userDAO: UserCollection.UserDAO = this.getDAO({ "profile.mobileE164": 1 });

    if (!_.isUndefined(userDAO)) {
      let profile = userDAO.profile;
      return profile.mobileE164;
    } else {
      return null;
    }
  }

  get pendingGroups(): Array<Group> {
    let groupIds: Array<string> = this.getDAO({ "profile.pendingGroups": 1 }, true).profile.pendingGroups;

    let pendingGroups: Array<Group> = new Array();

    _.forEach(groupIds, function(groupId: string) {
      pendingGroups.push(new Group(groupId));
    });

    return pendingGroups;
  }

  get pendingGroupIdsOnce(): Array<string> {
    return this.getDAO({ "profile.pendingGroups": 1 }, false).profile.pendingGroups;
  }


  get pendingGroupIds(): Array<string> {
    return this.getDAO({ "profile.pendingGroups": 1 }, true).profile.pendingGroups;
  }

  get placeName(): string {
    return this.getDAO({ "profile.placeName": 1 }, true).profile.placeName;
  }

  get zip(): string {
    return this.getDAO({ "profile.zip": 1 }, true).profile.zip;
  }

  public getCoordinatingGroups(reactive?: boolean): Array<Group> {
    let groupDAOs: Array<GroupDAO> = Groups.find(
      {
        coordinators: { $in: [Meteor.userId()] }
      },
      { sort: { _id: 1 }, "reactive": reactive }).fetch();

    let coordinatingGroups: Array<Group> = new Array();

    _.forEach(groupDAOs, function(groupDAO) {
      coordinatingGroups.push(Group.createFromDAO(groupDAO));
    });

    return coordinatingGroups;
  }

  public delete() {
    UserCollection.users.remove({ _id: this.getId() });
  }

}

class UserNotificationManager {

  constructor(private user: User) {
  }

  public notifyAboutAssignmentById(assignmentId: string, type: AssignmentEventType, parameters?: UserNotification.AssignmentOptionsParameters) {

    let assignmentsOptions: UserNotification.AssignmentOptions = {
      id: assignmentId,
      type: AssignmentEventType[type]
    };

    assignmentsOptions = _.extend(assignmentsOptions, parameters);

    let notification: UserNotification.NotificationDAO = {
      "type": UserNotification.Type[UserNotification.Type.Assignment],
      "userId": this.user.getId(),
      "assignmentOptions": assignmentsOptions
    };

    Notifications.insert(notification);
  }

  public notify(notificationData: UserNotification.DisplayableNotifcation) {
    let notification: UserNotification.NotificationDAO = {
      type: UserNotification.Type[UserNotification.Type.Simple],
      userId: this.user.getId(),
      simpleData: notificationData
    };

    Notifications.insert(notification);
  }

  public notifyAboutAssignment(assignment: Assignment, type: AssignmentEventType) {
    this.notifyAboutAssignmentById(assignment.getAssignmentId(), type);
  }

  public getAllNotifications(reactive?: boolean, limit?: number): Mongo.Cursor<UserNotification.NotificationDAO> {
    if (!reactive) {
      reactive = false;
    }
    if (!limit) {
      limit = 0;
    }


    return Notifications.find({ "userId": this.user.getId() }, { sort: { when: -1 }, limit: limit });


  }

  public markAllNotificationsAsSeen(): void {
    let unread: Array<UserNotification.NotificationDAO> = this.getUnreadNotifications().fetch();

    _.forEach(unread, function(notfification) {
      Notifications.update({ "_id": notfification._id }, {
        $set: {
          "seen": true
        }
      });
    });

  }

  public removeSeen(): void {
    let read: Array<UserNotification.NotificationDAO> = this.getReadNotifications().fetch();

    _.forEach(read, function(notfification) {
      Notifications.remove({ "_id": notfification._id });
    });
  }

  public removeAll(): void {
    let allNotifications: Array<UserNotification.NotificationDAO> = this.getAllNotifications().fetch();

    _.forEach(allNotifications, function(notfification) {
      Notifications.remove({ "_id": notfification._id });
    });
  }

  public getUnreadNotifications(reactive?: boolean, limit?: number): Mongo.Cursor<UserNotification.NotificationDAO> {
    if (!reactive) {
      reactive = false;
    }
    if (!limit) {
      limit = 0;
    }


    return Notifications.find({ "userId": this.user.getId(), "seen": false }, { sort: { when: -1 }, limit: limit });

  }

  public getReadNotifications(reactive?: boolean, limit?: number): Mongo.Cursor<UserNotification.NotificationDAO> {
    if (!reactive) {
      reactive = false;
    }
    if (!limit) {
      limit = 0;
    }


    return Notifications.find({ "userId": this.user.getId(), "seen": true }, { sort: { when: -1 }, limit: limit });

  }

  public hasUnreadNotifications(): boolean {
    return Notifications.find({ "userId": this.user.getId(), "seen": false }, { limit: 1 }).count() > 0;

  }

}

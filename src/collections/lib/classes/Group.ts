import * as _ from "underscore";
import {Meteor} from "meteor/meteor";
import {Template} from "meteor/templating";
import {Session} from "meteor/session";
import {Mongo} from "meteor/mongo";
import {Blaze} from "meteor/blaze";
import {Counts} from "meteor/tmeasday:publish-counts";


import * as UserCollection from "../../../collections/lib/UserCollection";
import User from "../../../collections/lib/classes/User";

import {Groups, GroupDAO} from "../GroupCollection";

import {UserEntry, AssignmentDAO, Assignments} from "../AssignmentsCollection";

import * as moment from "moment";


/**
 * Diese Klasse stellt zusätzliche Funktionen für die Einsätze zur Verfügung.
 */
export default class Group {
  private id: string;

  public static createFromDAO(dao: GroupDAO): Group {
    return new Group(dao._id);
  }

  public static createFromId(id: string): Group {
    return new Group(id);
  }

  /**
   * Überprüft, ob eine Gruppe mit der ID.
   */
  public static groupExists(groupId: string): boolean {
    // Check if group exists.
    var groupCount = Groups.find({
      "_id": groupId
    }, { fields: { "_id": 1 } }).count();
    return groupCount > 0;
  }

  /**
   * Konstruktor.
   * @param id Die ID der Gruppe.
   */
  constructor(id: string) {
    this.id = id
  }

  /**
   * Gibt ein DAO der Gruppe.
   * @returns Das DAO der Gruppe.
   */
  public getDAO(fields?: Mongo.FieldSpecifier, reactive?: boolean): GroupDAO {
    var projection;

    if (!reactive) {
      reactive = false;
    }

    if (fields) {
      projection = { "fields": fields };
    }

    return Groups.findOne({ _id: this.getId() }, projection);
  }

  /**
   * Trägt den gegebenen User als Bewerber für die Gruppe ein.
   * @param user Ein User Objekt.
   */
  public addUserAsApplicantByDAO(user: UserCollection.UserDAO): void {
    this.addUserAsApplicantById(user._id);
  }

  public exists(): boolean {
    return Group.groupExists(this.getId());
  }

  /**
   * Trägt den gegebenen User als Bewerber für die Gruppe ein.
   * @param userId Die ID des Bewerbers.
   */
  public addUserAsApplicantById(userId: string): void {
    var user = Meteor.users.findOne({
      _id: userId
    }, { fields: { "_id": 1 } });

    if (!this.isMemberByDAO(user) && !this.isApplicant(user)) {
      Meteor.users.update({
        _id: user._id
      }, {
          $push: {
            "profile.pendingGroups": this.id
          }
        });
    }
  }

  public addUserAsGroupMemberByDAO(user: UserCollection.UserDAO): void {
    this.addUserAsGroupMemberById(user._id);
  }

  public addUserAsGroupMemberById(userId: string): void {
    var user: User = new User(userId);

    if (user.exists() && !this.isMember(user)) {
      Meteor.users.update({
        _id: user.getId()
      }, {
          $pull: {
            "profile.pendingGroups": this.id
          },
          $push: {
            "groups": this.id
          }
        });

      // User benachrichtigen

      user.notificationManager.notify({
        title: "Willkommen!",
        details: "Herzlich Willkommen in der Gruppe " + this.name + ".",
        icon: "fa fa-thumbs-o-up faa-bounce animated-hover",
        hasLink: false
      });
    }
  }

  public getCoordinatorIds(reactive?: boolean): Array<string> {
    if (!reactive) {
      reactive = false;
    }

    return Groups.findOne({ _id: this.id }, { fields: { _id: 1, coordinators: 1 }, reactive: reactive }).coordinators;
  }

  public isMemberByDAO(user: Meteor.User | UserCollection.UserDAO): boolean {
    return this.isMemberById(user._id);
  }

  public isMember(user: User): boolean {
    return this.isMemberById(user.getId());
  }

  public isMemberById(userId: string): boolean {
    return Meteor.users.find({
      _id: userId,
      groups: {
        $in: [this.id]
      }
    }, { fields: { "_id": 1 } }).count() > 0;
  }

  public getMembers(reactive?: boolean): Array<User> {
    if (!reactive) {
      reactive = false;
    }

    var cursor = Meteor.users.find({
      groups: {
        $in: [this.id]
      }
    }, { fields: { "_id": 1 }, reactive: reactive });


    var users: Array<User> = cursor.map<User>(function(userDao: UserCollection.UserDAO) {
      return User.createFromDAO(userDao);
    });

    return users;
  }

  public sendNotificationToMembers(title: string, message: string) {
    var members = this.getMembers();

    _.forEach(members, function(member: User) {
      member.notificationManager.notify({
        title: title,
        details: message,
        icon: "fa fa-envelope",
        hasLink: false
      });
    });
  }

  public getEmailAddresses(reactive?: boolean): Array<string> {
    if (!reactive) {
      reactive = false;
    }

    var cursor = Meteor.users.find({
      groups: {
        $in: [this.id]
      }
    }, { fields: { "emails.address": 1 }, reactive: reactive });


    var emailAddresses: Array<string> = cursor.map<string>(function(userDao: UserCollection.UserDAO) {
      return userDao.emails[0].address;
    });

    return emailAddresses;
  }

  /**
   * Bestimmt, ob der User ein Bewerber ist oder nicht.
   * @param user Das User-Objekt des zu betrachtenen Users.
   * @returns {boolean} True, wenn User ein Bewerber ist.
   */
  public isApplicant(user: UserCollection.UserDAO): boolean {
    return this.isApplicantById(user._id);
  }

  /**
   * Bestimmt, ob der User ein Bewerber ist oder nicht.
   * @param userId Die ID des zu betrachtenen Users.
   * @returns {boolean} True, wenn User ein Bewerber ist.
   */
  public isApplicantById(userId: string): boolean {
    return Meteor.users.find({
      _id: userId,
      "profile.pendingGroups": {
        $in: [this.id]
      }
    }, { fields: { "_id": 1 } }).count() > 0;
  }


  /**
   * Entfernt den gegebenen User von den Bewerbern, falls vorhanden.
   * @param user Ein User Objekt.
   */
  public removeUserAsApplicant(user: UserCollection.UserDAO): void {
    this.removeUserAsApplicantById(user._id);
  }

  /**
   * Entfernt den gegebenen User von den Bewerbern, falls vorhanden.
   * @param userId Die ID des Bewerbers.
   */
  public removeUserAsApplicantById(userId: string): void {
    Meteor.users.update({
      _id: userId
    }, {
        $pull: {
          "profile.pendingGroups": this.id
        }
      });
  }

  /**
   * Entfernt den gegebenen User von den Gruppen Mitgliedern, falls vorhanden.
   * @param userId Die ID des Mitglieds.
   */
  public removeUserAsMember(user: UserCollection.UserDAO): void {
    this.removeUserAsMemberById(user._id);
  }

  /**
   * Entfernt den gegebenen User von den Gruppen Mitgliedern, falls vorhanden.
   * @param userId Die ID des Mitglieds.
   */
  public removeUserAsMemberById(userId: string): void {
    Meteor.users.update({
      _id: userId
    }, {
        $pull: {
          "groups": this.id
        }
      });
  }

  /**
   * Macht den gegebenen User ein Koordinator der Gruppe.
   * @param user Das User Objekt.
   */
  public addAsCoordinator(user: User): void {
    if (user.exists() && !user.isGroupCoordinator(this)) {
      Groups.update({
        _id: this.id
      }, {
          $push: {
            "coordinators": user.getId()
          }
        });
    }
  }

  /**
   * Entfernt den gegebenen User von den Gruppen Koordinatoren, falls er ist.
   * @param user Das User Objekt.
   */
  public removeAsCoordinator(user: User): void {

    Groups.update({
      _id: this.id
    }, {
        $pull: {
          "coordinators": user.getId()
        }
      });

  }

  public isCoordinatorByDAO(user: UserCollection.UserDAO, reactive?: boolean): boolean {
    return this.isCoordinatorById(user._id);
  }

  public isCoordinatorById(userId: string, reactive?: boolean): boolean {
    return _.contains(this.getCoordinatorIds(reactive), userId);
  }

  public isCoordinator(user: User, reactive?: boolean): boolean {
    return this.isCoordinatorById(user.getId());
  }


  /**
   * Gibt die ID der Gruppe.
   * @returns {string} Die ID des Gruppe.
   */
  public getId(): string {
    return this.id;
  }


  /**
   * Überprüft auf Gleichheit.
   * @param other Zu vergleichender Einsatz.
   * @return {boolean} True, wenn gleich.
   */
  public equals(other: Group): boolean {
    return other.getId() === this.getId();
  }

  public getUserCount(): number {
    return Meteor.users.find({
      groups: {
        $in: [this.getId()]
      }
    }, { fields: { "_id": 1 } }).count();
  }

  public get name(): string {
    return this.getDAO({ name: 1 }).name;
  }

  public get applicationController(): GroupApplicationController {
    return new GroupApplicationController(this.getId());
  }

  public getAvailableAssignmentsCountReactive(): number {
    return this.getAvailableAssignmentsCount(true);
  }

  public getAvailableAssignmentsCount(reactive?: boolean): number {
    if (!reactive) {
      reactive = false;
    }
    return this.getAvailableAssignments(reactive).count();
  }

  public getAvailableAssignments(reactive?: boolean): Mongo.Cursor<AssignmentDAO> {
    if (!reactive) {
      reactive = false;
    }
    return Assignments.find({ $and: [{ group: this.getId() }, { end: { $gte: moment().toDate() } }] }, { "reactive": reactive });
  }





}

// Klasse sichtbar machen für andere Script-Dateien


export class GroupApplicationController {

  public static APPLICATION_COUNT_SUBSCRIPTION = "groupApplicantCount";

  private static subscription: Meteor.SubscriptionHandle = null;

  /**
   * Konstruktor.
   * @param id Die ID der Gruppe.
   */
  constructor(private groupId: string) {
  }

  public getApplicantsIdCursor(reactive?: boolean): Mongo.Cursor<UserCollection.UserDAO> {
    if (!reactive) {
      reactive = false;
    }
    return UserCollection.users.find({ "profile.pendingGroups": { $in: [this.groupId] } }, { fields: { "_id": 1 }, "reactive": reactive });
  }

  public getApplicantsIdCursorReactive(): Mongo.Cursor<UserCollection.UserDAO> {
    return this.getApplicantsIdCursor(true);
  }

  public get counterName(): string {
    return "applicantsOfGroup_" + this.groupId;
  }

  public get applicationsCount(): number {
    return Counts.get(this.counterName);
  }

  public subscribeCount(): Meteor.SubscriptionHandle {
    return Meteor.subscribe(GroupApplicationController.APPLICATION_COUNT_SUBSCRIPTION, this.groupId);
  }

  public subscribeCountOnTemplate(templateInstance: Blaze.TemplateInstance): Meteor.SubscriptionHandle {
    return templateInstance.subscribe(GroupApplicationController.APPLICATION_COUNT_SUBSCRIPTION, this.groupId);
  }

}

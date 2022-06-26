import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import * as _ from "underscore";

import User from "../../../collections/lib/classes/User";
import { AssignmentState } from "./AssignmentState";
import Group from "./Group";

import { AssignmentDAO, Assignments, UserEntry } from "../AssignmentsCollection";

import * as moment from "moment";


/**
 * Diese Klasse stellt zusätzliche Funktionen für die Einsätze zur Verfügung.
 */
export default class Assignment {
  private id: string;

  public static createFromDAO(dao: AssignmentDAO): Assignment {
    return new Assignment(dao._id);
  }

  static get MonthStringFormat(): string {
    return "YYYY-MM";
  }

  /**
  * Konvertiert ein Datum in ein Format, das den Monat und das Jahr repräsentiert.
  * Dies wird für die Datenbank zwecks Optimierung verwendet.
  */
  public static convertDateToMonthString(date: Date | string | moment.Moment): string {
    let momentObject: moment.Moment = moment(date);
    return momentObject.format(Assignment.MonthStringFormat);
  }

  public static convertDateToWeekNumber(date: Date | string | moment.Moment): number {
    let momentObject: moment.Moment = moment(date);
    return momentObject.isoWeek();
  }

  public static convertDateToMonthNumber(date: Date | string | moment.Moment): number {
    let momentObject: moment.Moment = moment(date);
    return momentObject.month();
  }

  public static convertDateToYearOfIsoWeek(date: Date | string | moment.Moment): number {
    let momentObject: moment.Moment = moment(date).startOf("isoWeek");
    return momentObject.year();
  }
  public static convertDateToYear(date: Date | string | moment.Moment): number {
    let momentObject: moment.Moment = moment(date);
    return momentObject.year();
  }


  /**
   * Konstruktor.
   * @param id Die ID eines Einsatzes.
   */
  constructor(id: string) {
    this.id = id;

  }


  public getDAO(fields?: Mongo.FieldSpecifier, reactive?: boolean): AssignmentDAO {
    let options;

    if (!reactive) {
      reactive = false;
    }

    if (fields) {
      options = { "fields": fields, "reactive": reactive };
    }

    return Assignments.findOne({ _id: this.id }, options);
  }


  /**
   * Bestimmt, ob der User ein Bewerber ist oder nicht.
   * @param user Das User-Objekt des zu betrachtenen Users.
   * @returns {boolean} True, wenn User ein Bewerber ist.
   */
  public isUserApplicant(user: User): boolean {
    return this.isUserApplicantById(user.getId());
  }

  /**
   * Bestimmt, ob der User ein Bewerber ist oder nicht.
   * @param userId Die ID des zu betrachtenen Users.
   * @returns {boolean} True, wenn User ein Bewerber ist.
   */
  public isUserApplicantById(userId: string): boolean {
    return Assignments.find({
      _id: this.id,
      "applicants.user": userId
    }, { fields: { "_id": 1 } }).count() > 0;
  }

  public get applicantsCount(): number {
    return this.getDAO({ "applicants.user": 1 }, true).applicants.length;
  }

  public get participantsCount(): number {
    return this.getDAO({ "participants.user": 1 }, true).participants.length;
  }



  /**
   * Bestimmt, ob ein User bereits ein Teilnehmer ist.
   * @param userId ID des Users
   * @returns {boolean} True, wenn User ein Teilnehmer ist.
   */
  public isUserParticipantById(userId: string): boolean {
    return Assignments.find({
      _id: this.id,
      "participants.user": userId
    }, { fields: { "_id": 1 } }).count() > 0;
  }

  /**
   * Gibt die ID des Einsatzes.
   * @returns {string} Die ID des Einsatzes.
   */
  public getAssignmentId(): string {
    return this.id;
  }

  /**
   * Gibt die ID der Gruppe des Einsatzes.
   * @returns {string}
   */
  public getGroupId(): string {
    return Assignments.findOne({ _id: this.getAssignmentId() }, { fields: { group: 1 } }).group;
  }

  /**
   * Gibt das Gruppen-Objekt des Einsatzes.
   * @returns {Group}
   */
  public getGroup(): Group {

    let group: Group = new Group(this.getGroupId());
    return group;
  }

  /**
   * Überprüft auf Gleichheit.
   * @param other Zu vergleichender Einsatz.
   * @return {boolean} True, wenn gleich.
   */
  public equals(other: Assignment): boolean {
    return other.getAssignmentId() === this.getAssignmentId();
  }

  public isUserParticipant(user: User): boolean {
    return this.isUserParticipantById(user.getId());
  }

  public getParticipantIds(reactive?: boolean): Array<string> {
    let participantIds: Array<string> = [];

    if (!reactive) {
      reactive = false;
    }

    _.forEach(Assignments.findOne({ _id: this.getAssignmentId() }, { fields: { "participants": 1 }, "reactive": reactive }).participants, function (participant: UserEntry) {
      participantIds.push(participant.user);
    });

    return participantIds;
  }

  public getParticipantIdsReactive(): Array<string> {
    return this.getParticipantIds(true);
  }

  public getParticipants(reactive?: boolean): Array<User> {
    let participants: Array<User> = [];

    if (!reactive) {
      reactive = false;
    }

    let assignmentDAO: AssignmentDAO = Assignments.findOne({ _id: this.getAssignmentId() }, { fields: { "participants": 1 }, "reactive": reactive });

    if (_.isUndefined(assignmentDAO)) {
      return [];
    }

    _.forEach(assignmentDAO.participants, function (participant: UserEntry) {
      participants.push(new User(participant.user));
    });

    return participants;
  }


  public getParticipantsReactive(): Array<User> {
    return this.getParticipants(true);
  }

  public isClosed(reactive?: boolean): boolean {
    if (!reactive) {
      reactive = false;
    }
    return Assignments.findOne({ _id: this.getAssignmentId() }, { fields: { "state": 1 }, "reactive": reactive }).state === AssignmentState[AssignmentState.Closed];
  }

  public isCanceled(reactive?: boolean): boolean {
    if (!reactive) {
      reactive = false;
    }
    return this.getState(reactive) === AssignmentState.Canceled;
  }


  public getApplicantIds(reactive?: boolean): Array<string> {
    let applicantIds: Array<string> = [];

    if (!reactive) {
      reactive = false;
    }

    _.forEach(Assignments.findOne({ _id: this.getAssignmentId() }, { fields: { "applicants": 1 }, "reactive": reactive }).applicants, function (applicant: UserEntry) {
      applicantIds.push(applicant.user);
    });

    return applicantIds;
  }


  public getContactIds(reactive?: boolean): Array<string> {
    if (!reactive) {
      reactive = false;
    }
    return Assignments.findOne({ _id: this.getAssignmentId() }, { fields: { contacts: 1 }, "reactive": reactive }).contacts;
  }

  public getContactsReactive(): Array<User> {
    let ids = this.getContactIds(true);

    let contacts = new Array<User>();

    _.forEach(ids, function (id: string) {
      contacts.push(new User(id));
    });

    return contacts;
  }

  public getApplicantIdsReactive(): Array<string> {
    return this.getApplicantIds(true);
  }


  //TODO: Unit Test für setApplicantIds() und setParticipantIds()


  public getTotalUsersCountReactive(): number {
    let applicantIds: Array<string> = this.getApplicantIdsReactive();
    let participantIds: Array<string> = this.getParticipantIdsReactive();

    if (applicantIds && participantIds) {
      return applicantIds.length + participantIds.length;
    } else {
      throw new Meteor.Error("403", "Cannot access applicants OR participants", "Please adjust the published data.");
    }
  }


  /**
  * Gibt das Teilnehmer-Ziel des Einsatzes zurück.
  * @return Teilnehmer-Ziel oder negative Zahl, wenn keins definiert.
  */
  public getUserGoal(reactive?: boolean): number {
    if (!reactive) {
      reactive = false;
    }

    let assignmentDAO: AssignmentDAO = Assignments.findOne({ _id: this.getAssignmentId() }, { fields: { "userGoal": 1 }, "reactive": reactive });
    let userGoal = assignmentDAO.userGoal;

    if (!userGoal || (userGoal === 0)) {
      userGoal = -1;
    }

    return userGoal;
  }

  get name() {
    let assignmentDAO: AssignmentDAO = Assignments.findOne({ _id: this.getAssignmentId() }, { fields: { "name": 1 } });
    return assignmentDAO.name;
  }

  get start() {
    let assignmentDAO: AssignmentDAO = Assignments.findOne({ _id: this.getAssignmentId() }, { fields: { "start": 1 } });
    return assignmentDAO.start;
  }

  public getState(reactive?: boolean): AssignmentState {
    if (!reactive) {
      reactive = false;
    }
    let stateString: string = this.getDAO({ "state": 1 }, reactive).state;

    return AssignmentState[stateString];
  }


}

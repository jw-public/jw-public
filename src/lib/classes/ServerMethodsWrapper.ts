import { Meteor } from "meteor/meteor";







export class AssignmentProxy {
  private _id: string;
  constructor(id: string) {
    this._id = id;
  }

  public applyOnAssignment(callback: (err: Meteor.Error) => void) {
    Meteor.call('applyOnAssignment', this._id, callback);
  }

  public cancelApplication(callback: (err: Meteor.Error) => void) {
    Meteor.call('cancelApplicationAssignment', this._id, callback);
  }

  public isApplicant(callback: (err: Meteor.Error, isApplicant: boolean) => void) {
    Meteor.call('userIsApplicant', this._id, callback);
  }

  public addUserAsParticipant(userId: string, callback: (err: Meteor.Error) => void) {
    Meteor.call('addUserAsAssignmentParticipant', userId, this._id, callback);
  }

  public removeUserAsParticipant(userId: string, callback: (err: Meteor.Error) => void) {
    Meteor.call('removeUserAsAssignmentParticipant', userId, this._id, callback);
  }

  public close(participantIds: Array<string>, callback: (err: Meteor.Error) => void) {
    Meteor.call('closeAssignment', participantIds, this._id, callback);
  }

  public reenable(reason: string, callback: (err: Meteor.Error) => void) {
    Meteor.call('reenableAssignment', this._id, reason, callback);
  }

  public cancel(reason: string, callback: (err: Meteor.Error) => void) {
    Meteor.call('cancelAssignment', this._id, reason, callback);
  }

  public remove(callback: (err: Meteor.Error) => void) {
    Meteor.call('removeAssignment', this._id, callback);
  }

}


export class GroupProxy {
  private _id: string;
  constructor(id: string) {
    this._id = id;
  }

  public getUserCountOfGroup(callback: (err: Meteor.Error, count: number) => void) {
    Meteor.call('getUsersInGroupCount', this._id, callback);
  }

  public addUserToGroup(userId: string, callback: (err: Meteor.Error) => void) {
    Meteor.call('addToGroup', userId, this._id, callback);
  }

  public denyUser(userId: string, callback: (err: Meteor.Error) => void) {
    Meteor.call('denyUser', userId, this._id, callback);
  }

  public isGroupMember(userId: string, callback: (err: Meteor.Error, isMember: boolean) => void) {
    Meteor.call('isGroupMember', userId, this._id, callback);
  }

}

export module Email {
  export function send(to: string, from: string, subject: string, text: string, callback: (err: Meteor.Error) => void) {
    Meteor.call('sendEmail', to, from, subject, text, callback);
  }

  export function reloadServerSettings(callback: (err: Meteor.Error) => void) {
    Meteor.call('reloadEmailSettings', callback);
  }
}

export module Validator {
  export function validatePhoneNumber(phoneNumber: string, callback: (err: Meteor.Error, isValid: boolean) => void) {
    Meteor.call('validatePhoneNumber', phoneNumber, callback);
  }
}

export class AdminUserProxy {
  private _id: string;
  constructor(id: string) {
    this._id = id;
  }
  public removeUser(callback: (err: Meteor.Error) => void) {
    Meteor.call('removeUser', this._id, callback);
  }
}

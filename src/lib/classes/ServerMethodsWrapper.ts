import { Meteor } from "meteor/meteor";

// Promise-based wrappers around the app's Meteor methods (Meteor.callAsync).

export class AssignmentProxy {
  private _id: string;
  constructor(id: string) {
    this._id = id;
  }

  public applyOnAssignment(): Promise<void> {
    return Meteor.callAsync("applyOnAssignment", this._id);
  }

  public cancelApplication(): Promise<void> {
    return Meteor.callAsync("cancelApplicationAssignment", this._id);
  }

  public isApplicant(): Promise<boolean> {
    return Meteor.callAsync("userIsApplicant", this._id);
  }

  public addUserAsParticipant(userId: string): Promise<void> {
    return Meteor.callAsync("addUserAsAssignmentParticipant", userId, this._id);
  }

  public removeUserAsParticipant(userId: string): Promise<void> {
    return Meteor.callAsync("removeUserAsAssignmentParticipant", userId, this._id);
  }

  public close(participantIds: Array<string>): Promise<void> {
    return Meteor.callAsync("closeAssignment", participantIds, this._id);
  }

  public reenable(reason: string): Promise<void> {
    return Meteor.callAsync("reenableAssignment", this._id, reason);
  }

  public cancel(reason: string): Promise<void> {
    return Meteor.callAsync("cancelAssignment", this._id, reason);
  }

  public remove(): Promise<void> {
    return Meteor.callAsync("removeAssignment", this._id);
  }
}

export class GroupProxy {
  private _id: string;
  constructor(id: string) {
    this._id = id;
  }

  public getUserCountOfGroup(): Promise<number> {
    return Meteor.callAsync("getUsersInGroupCount", this._id);
  }

  public addUserToGroup(userId: string): Promise<void> {
    return Meteor.callAsync("addToGroup", userId, this._id);
  }

  public denyUser(userId: string): Promise<void> {
    return Meteor.callAsync("denyUser", userId, this._id);
  }

  public isGroupMember(userId: string): Promise<boolean> {
    return Meteor.callAsync("isGroupMember", userId, this._id);
  }

  public copyAssignmentWeek({
    from,
    to,
  }: {
    from: {
      calendarWeek: number;
      year: number;
    };
    to: {
      calendarWeek: number;
      year: number;
    };
  }): Promise<number> {
    return Meteor.callAsync(
      "copyAssignmentWeek",
      this._id,
      from.calendarWeek,
      from.year,
      to.calendarWeek,
      to.year,
    );
  }
}

export namespace Email {
  export function send(to: string, from: string, subject: string, text: string): Promise<void> {
    return Meteor.callAsync("sendEmail", to, from, subject, text);
  }

  export function reloadServerSettings(): Promise<void> {
    return Meteor.callAsync("reloadEmailSettings");
  }
}

export namespace Validator {
  export function validatePhoneNumber(phoneNumber: string): Promise<boolean> {
    return Meteor.callAsync("validatePhoneNumber", phoneNumber);
  }
}

export class AdminUserProxy {
  private _id: string;
  constructor(id: string) {
    this._id = id;
  }
  public removeUser(): Promise<void> {
    return Meteor.callAsync("removeUser", this._id);
  }
}

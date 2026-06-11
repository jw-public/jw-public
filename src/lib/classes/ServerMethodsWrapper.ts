import { Meteor } from "meteor/meteor";

// Promise-based wrappers around the app's Meteor methods (Meteor.callAsync).

export class AssignmentProxy {
  private _id: string;
  constructor(id: string) {
    this._id = id;
  }

  public async applyOnAssignment(): Promise<void> {
    await Meteor.callAsync("applyOnAssignment", this._id);
  }

  public async cancelApplication(): Promise<void> {
    await Meteor.callAsync("cancelApplicationAssignment", this._id);
  }

  public isApplicant(): Promise<boolean> {
    return Meteor.callAsync("userIsApplicant", this._id);
  }

  public async addUserAsParticipant(userId: string): Promise<void> {
    await Meteor.callAsync("addUserAsAssignmentParticipant", userId, this._id);
  }

  public async removeUserAsParticipant(userId: string): Promise<void> {
    await Meteor.callAsync("removeUserAsAssignmentParticipant", userId, this._id);
  }

  public async close(participantIds: Array<string>): Promise<void> {
    await Meteor.callAsync("closeAssignment", participantIds, this._id);
  }

  public async reenable(reason: string): Promise<void> {
    await Meteor.callAsync("reenableAssignment", this._id, reason);
  }

  public async cancel(reason: string): Promise<void> {
    await Meteor.callAsync("cancelAssignment", this._id, reason);
  }

  public async remove(): Promise<void> {
    await Meteor.callAsync("removeAssignment", this._id);
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

  public async addUserToGroup(userId: string): Promise<void> {
    await Meteor.callAsync("addToGroup", userId, this._id);
  }

  public async denyUser(userId: string): Promise<void> {
    await Meteor.callAsync("denyUser", userId, this._id);
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
  export async function send(
    to: string,
    from: string,
    subject: string,
    text: string,
  ): Promise<void> {
    await Meteor.callAsync("sendEmail", to, from, subject, text);
  }

  export async function reloadServerSettings(): Promise<void> {
    await Meteor.callAsync("reloadEmailSettings");
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
  public async removeUser(): Promise<void> {
    await Meteor.callAsync("removeUser", this._id);
  }
}

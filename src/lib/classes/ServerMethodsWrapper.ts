import { callMethod } from "../../imports/methods/MethodContracts";

// Promise-based wrappers around the app's Meteor methods. Names, argument
// lists and result types come from the shared wire contract
// (imports/methods/MethodContracts.ts).

export class AssignmentProxy {
  private _id: string;
  constructor(id: string) {
    this._id = id;
  }

  public applyOnAssignment(): Promise<void> {
    return callMethod("applyOnAssignment", this._id);
  }

  public cancelApplication(): Promise<void> {
    return callMethod("cancelApplicationAssignment", this._id);
  }

  public isApplicant(): Promise<boolean> {
    return callMethod("userIsApplicant", this._id);
  }

  public addUserAsParticipant(userId: string): Promise<void> {
    return callMethod("addUserAsAssignmentParticipant", userId, this._id);
  }

  public removeUserAsParticipant(userId: string): Promise<void> {
    return callMethod("removeUserAsAssignmentParticipant", userId, this._id);
  }

  public close(participantIds: Array<string>): Promise<void> {
    return callMethod("closeAssignment", participantIds, this._id);
  }

  public reenable(reason: string): Promise<void> {
    return callMethod("reenableAssignment", this._id, reason);
  }

  public cancel(reason: string): Promise<void> {
    return callMethod("cancelAssignment", this._id, reason);
  }

  public remove(): Promise<void> {
    return callMethod("removeAssignment", this._id);
  }
}

export class GroupProxy {
  private _id: string;
  constructor(id: string) {
    this._id = id;
  }

  public getUserCountOfGroup(): Promise<number> {
    return callMethod("getUsersInGroupCount", this._id);
  }

  public addUserToGroup(userId: string): Promise<void> {
    return callMethod("addToGroup", userId, this._id);
  }

  public denyUser(userId: string): Promise<void> {
    return callMethod("denyUser", userId, this._id);
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
    return callMethod(
      "copyAssignmentWeek",
      this._id,
      from.calendarWeek,
      from.year,
      to.calendarWeek,
      to.year,
    );
  }
}

export namespace Validator {
  export function validatePhoneNumber(phoneNumber: string): Promise<boolean> {
    return callMethod("validatePhoneNumber", phoneNumber);
  }
}

export class AdminUserProxy {
  private _id: string;
  constructor(id: string) {
    this._id = id;
  }
  public removeUser(): Promise<void> {
    return callMethod("removeUser", this._id);
  }
}

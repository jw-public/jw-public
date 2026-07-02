import { Meteor } from "meteor/meteor";
import { InactivityReport } from "../cleanup/InactivityReport";

/**
 * Wire contract of every Meteor method: one source of truth shared by the
 * server implementation (server/methods.ts types its object against this) and
 * the client (callMethod below). A renamed method or changed signature is a
 * compile error on both ends instead of a runtime 404.
 *
 * `result` is the resolved value — the transport is always a Promise on the
 * client, while server implementations may be sync or async.
 */
export interface MethodSignatures {
  adminSetUserRoles: { args: [targetUserId: string, roles: string[]]; result: void };
  getAllUsersCount: { args: []; result: number };
  getUsersInGroupCount: { args: [groupId: string]; result: number };
  userExists: { args: [username: string]; result: boolean };
  groupExists: { args: [groupId: string]; result: boolean };
  addToGroup: { args: [userToBeAddedId: string, groupId: string]; result: void };
  denyUser: { args: [userToDenyId: string, groupId: string]; result: void };
  applyOnAssignment: { args: [assignmentId: string]; result: void };
  cancelApplicationAssignment: { args: [assignmentId: string]; result: void };
  userIsApplicant: { args: [assignmentId: string]; result: boolean };
  addUserAsAssignmentParticipant: {
    args: [userToBeAddedId: string, assignmentId: string];
    result: void;
  };
  removeUserAsAssignmentParticipant: {
    args: [userToBeRemovedId: string, assignmentId: string];
    result: void;
  };
  closeAssignment: { args: [participantIds: string[], assignmentId: string]; result: void };
  cancelAssignment: { args: [assignmentId: string, reason: string]; result: void };
  reenableAssignment: { args: [assignmentId: string, reason: string]; result: void };
  removeAssignment: { args: [assignmentId: string]; result: void };
  sendEmail: { args: [to: string, from: string, subject: string, text: string]; result: void };
  copyAssignmentWeek: {
    args: [
      groupId: string,
      fromIsoWeek: number,
      fromIsoYear: number,
      toIsoWeek: number,
      toIsoYear: number,
    ];
    result: number;
  };
  validatePhoneNumber: { args: [phoneNumber: string]; result: boolean };
  removeUser: { args: [userToRemoveId: string]; result: void };
  acceptTermsOfUse: { args: []; result: void };
  adminInactivityReport: { args: [thresholdDays: number]; result: InactivityReport };
  adminDeleteGroup: { args: [groupId: string]; result: { removedAssignments: number } };
}

export type MethodName = keyof MethodSignatures;

/** Shape server/methods.ts must implement. */
export type MethodImplementations = {
  [N in MethodName]: (
    this: Meteor.MethodThisType,
    ...args: MethodSignatures[N]["args"]
  ) => MethodSignatures[N]["result"] | Promise<MethodSignatures[N]["result"]>;
};

/** Typed Meteor.callAsync: method name, arguments and result come from the contract. */
export function callMethod<N extends MethodName>(
  name: N,
  ...args: MethodSignatures[N]["args"]
): Promise<MethodSignatures[N]["result"]> {
  return Meteor.callAsync(name, ...args) as Promise<MethodSignatures[N]["result"]>;
}

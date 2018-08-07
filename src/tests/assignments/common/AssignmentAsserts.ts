import {UserEntry, AssignmentDAO} from "../../../collections/lib/AssignmentsCollection";
import {assert} from "chai";
import * as _ from "underscore";




export class AssignmentAsserts {
  constructor(private assignment: AssignmentDAO) {

  }

  containsUserIdInApplicants(userId: string, message?: string) {
    assertContainsUserEntry(this.assignment.applicants, userId, message);
  }

  containsUserIdInParticipants(userId: string, message?: string) {
    assertContainsUserEntry(this.assignment.participants, userId, message);
  }

  applicantCountIs(expected: number, message?: string) {
    assert.lengthOf(this.assignment.applicants, expected, message);
  }

  participantCountIs(expected: number, message?: string) {
    assert.lengthOf(this.assignment.participants, expected, message);
  }
}

function containsUserEntry(userEntryArray: Array<UserEntry>, userId: string): boolean {
  return _.findIndex(userEntryArray, (userEntry) => { return userEntry.user === userId }) >= 0;
}

function assertContainsUserEntry(userEntryArray: Array<UserEntry>, userId: string, message?: string): void {
  return assert.isTrue(containsUserEntry(userEntryArray, userId), `${message}\nThe user ${userId} is not part of ${JSON.stringify(userEntryArray) }.`);
}

import * as _ from "underscore";
import { AssignmentDAO, UserEntry } from "../../collections/lib/AssignmentsCollection";
import { AssignmentState } from "../../collections/lib/classes/AssignmentState";

export interface AssignmentStateForUser {
  canceled: boolean;
  closed: boolean;
  isParticipant: boolean;
  isApplicant: boolean;
}

export interface IAssignmentStateReader {
  isClosed(): boolean;
  isCanceled(): boolean;
  isParticipantById(userId: string | null): boolean;
  isApplicantById(userId: string | null): boolean;
  getAssignmentState(userId: string | null): AssignmentStateForUser;
}

export class AssignmentStateReader implements IAssignmentStateReader {
  private participantIds: Array<string> = [];
  private applicantIds: Array<string> = [];

  public static fromAssignmentDAO(assignment: AssignmentDAO): IAssignmentStateReader {
    return new AssignmentStateReader(assignment);
  }

  constructor(private assignment: AssignmentDAO) {
    this.initParticipantIds();
    this.initApplicantIds();
  }

  private initParticipantIds(): void {
    this.participantIds = this.mapUserEntriesToIdArray(this.assignment.participants);
  }

  private initApplicantIds(): void {
    this.applicantIds = this.mapUserEntriesToIdArray(this.assignment.applicants);
  }

  private mapUserEntriesToIdArray(userEntries: Array<UserEntry>): Array<string> {
    return _.map(userEntries, (userEntry) => userEntry.user);
  }

  getAssignmentState(userId: string | null): AssignmentStateForUser {
    return {
      canceled: this.isCanceled(),
      closed: this.isClosed(),
      isParticipant: this.isParticipantById(userId),
      isApplicant: this.isApplicantById(userId),
    };
  }

  isClosed(): boolean {
    return (
      AssignmentState[this.assignment.state as keyof typeof AssignmentState] ===
      AssignmentState.Closed
    );
  }
  isCanceled(): boolean {
    return (
      AssignmentState[this.assignment.state as keyof typeof AssignmentState] ===
      AssignmentState.Canceled
    );
  }

  isParticipantById(userId: string | null): boolean {
    let participantIds = this.getParticipantIds();
    return _.contains(participantIds, userId);
  }

  private getParticipantIds(): Array<string> {
    return this.participantIds;
  }

  isApplicantById(userId: string | null): boolean {
    let applicantIds = this.getApplicantIds();
    return _.contains(applicantIds, userId);
  }

  private getApplicantIds(): Array<string> {
    return this.applicantIds;
  }
}

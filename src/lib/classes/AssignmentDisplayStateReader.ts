import { IAssignmentStateReader, AssignmentStateForUser} from "./AssignmentStateReader";
import {AssignmentStateReader} from "./AssignmentStateReader";


import {AssignmentDAO} from "../../collections/lib/AssignmentsCollection";

export enum DisplayState {
  Canceled, UserAccepted, Closed, UserApplicant, Default
}


export interface IAssignmentDisplayStateReader {

  getDisplayState(): DisplayState;

}

 class AssignmentDisplayStateReaderFactorySecondStep {


  constructor(private stateReader: IAssignmentStateReader) {

  }

  withUserId(userId: string): IAssignmentDisplayStateReader {
    return new AssignmentDisplayStateReader(this.stateReader, userId);
  }

}


export class AssignmentDisplayStateReader implements IAssignmentDisplayStateReader {


  public static fromAssignmentStateReader(assignmentStateReader: IAssignmentStateReader) {
    return new AssignmentDisplayStateReaderFactorySecondStep(assignmentStateReader);
  }

  constructor(private assignmentStateReader: IAssignmentStateReader, private userId: string) {

  }

  private get assignmentState() {
    let stateReader = this.assignmentStateReader;

    return {
      canceled: stateReader.isCanceled(),
      closed: stateReader.isClosed(),
      isParticipant: stateReader.isParticipantById(this.userId),
      isApplicant: stateReader.isApplicantById(this.userId),
    };
  }

  public getDisplayState(): DisplayState {
    let state = this.assignmentState;

    if (state.canceled) {
      return DisplayState.Canceled;
    } else if (state.isParticipant) {
      return DisplayState.UserAccepted;
    } else if (state.closed) {
      return DisplayState.Closed;
    } else if (state.isApplicant) {
      return DisplayState.UserApplicant;
    }

    return DisplayState.Default;
  }

}

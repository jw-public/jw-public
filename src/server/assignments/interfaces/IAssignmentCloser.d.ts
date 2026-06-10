export interface IAssignmentCloser {
  closeAssignment(options: {
    assignmentId: string;
    participantIds: Array<string>
  }): Promise<void>;
}

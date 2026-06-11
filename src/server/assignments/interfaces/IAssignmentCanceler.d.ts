export interface IAssignmentCanceler {
  cancelAssignment(assignmentId: string, reason: string): Promise<void>;
}

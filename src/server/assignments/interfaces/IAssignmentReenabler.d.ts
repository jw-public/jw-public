export interface IAssignmentReenabler {
  reenableAssignment(assignmentId: string, reason: string): Promise<void>;
}

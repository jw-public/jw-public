export interface IAssignmentRemover {
  removeAssignment(assignmentId: string): Promise<void>;
}

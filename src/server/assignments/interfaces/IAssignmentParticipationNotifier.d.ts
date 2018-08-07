export interface IAssignmentNotifierOptions {
    userIds: Array<string>,
    assignmentId: string
}

/**
* I am a notifier, which notifies users, when the get accepted or rejected from an assignment.
*/
export interface IAssignmentParticipationNotifier {

    /**
    * Notifies given users about their acceptance to the assignment.
    */
    notifyUsersAreAccepted(options: IAssignmentNotifierOptions);

    /**
    * Notifies given users about their removal from the assignment.
    */
    notifyUsersAreNotAccepted(options: IAssignmentNotifierOptions);

}

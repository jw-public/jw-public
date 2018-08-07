/**
* I am a controller, which enables my users to add or remove participants to an assignment.
*/
export interface IAssignmentParticipantController {

    /**
     * Removes a user from an assignment, if he is marked as participant.
     * Notifies the user, if he was removed.
     * @param userId The user ID of the participants.
     */
    removeUserAsParticipantAndNotify(userId: string): boolean;

    /**
     * Marks any given user by id as participant for the assignment.
     * Notifies the user, if he was removed.
     * @param userId The user ID of the participants.
     */
    addUserAsParticipantAndNotify(userId: string): boolean;
}

/**
* I am a controller, which enables my users to add or remove applicants to an assignment.
*/
export interface IAssignmentApplicationController {

   /**
    * Removes a user from an assignment, if he is marked as applicant.
    * @param userId The user ID of the applicant.
    */
   removeUserAsApplicantById(userId: string): void;

   /**
    * Marks any given user by id as applicant for the assignment.
    * @param userId The user ID of the applicant.
    */
   addUserAsApplicantById(userId: string): void;
}

import { inject, injectable, named } from "inversify";
import { AssignmentDAO } from "../../../collections/lib/AssignmentsCollection";
import { SimpleCollection } from "../../../imports/interfaces/SimpleCollection";
import { Logger } from '../../../imports/logging/Logger';
import { LoggerFactory } from '../../../imports/logging/LoggerFactory';
import { Types } from "../../Types";
import { IAssignmentApplicationController } from "../interfaces/IAssignmentApplicationController";
import { IAssignmentContext } from "../interfaces/IAssignmentContext";

@injectable()
export class AssignmentApplicationController implements IAssignmentApplicationController {

  private assignmentContext: IAssignmentContext;
  private logger: Logger;

  constructor(@inject(Types.Collection) @named("assignment") private collection: SimpleCollection<AssignmentDAO>,
    @inject(Types.LoggerFactory) loggerFactory: LoggerFactory,
  ) {
    this.logger = loggerFactory.createLogger("AssignmentApplicationController");
  }

  get assignmentId(): string {
    return this.assignmentContext.getAssignmentId();
  }


  public addUserAsApplicantById(userId: string): void {
    this.logger.info(`User ${userId} applies to ${this.assignmentId}`)

    this.collection.update({
      _id: this.assignmentId,
      "applicants.user": { // User darf nicht sich bereits beworben haben.
        $ne: userId
      },
      "participants.user": { // User darf auch nicht bereits ein Teilnehmer sein.
        $ne: userId
      }
    }, {
      $push: {
        applicants: {
          user: userId
        }
      }
    });
  };

  public removeUserAsApplicantById(userId: string): void {
    this.logger.info(`User ${userId} removes application from ${this.assignmentId}`)

    this.collection.update({
      _id: this.assignmentId
    }, {
      $pull: {
        "applicants": {
          "user": userId
        } // Wird als Bewerber entfernt.
      }
    });

  };



}

import { AssignmentDAO } from "../../../collections/lib/AssignmentsCollection";
import { SimpleCollection } from "../../../imports/interfaces/SimpleCollection";
import { Logger } from "../../../imports/logging/Logger";
import { LoggerFactory } from "../../../imports/logging/LoggerFactory";
import { IAssignmentApplicationController } from "../interfaces/IAssignmentApplicationController";
import { IAssignmentContext } from "../interfaces/IAssignmentContext";

export class AssignmentApplicationController implements IAssignmentApplicationController {
  // injected post-construction by services.ts
  private assignmentContext!: IAssignmentContext;
  private logger: Logger;

  constructor(
    private collection: SimpleCollection<AssignmentDAO>,
    loggerFactory: LoggerFactory,
  ) {
    this.logger = loggerFactory.createLogger("AssignmentApplicationController");
  }

  get assignmentId(): string {
    return this.assignmentContext.getAssignmentId();
  }

  public async addUserAsApplicantById(userId: string): Promise<void> {
    this.logger.info(`User ${userId} applies to ${this.assignmentId}`);

    await this.collection.updateAsync(
      {
        _id: this.assignmentId,
        "applicants.user": {
          // User darf nicht sich bereits beworben haben.
          $ne: userId,
        },
        "participants.user": {
          // User darf auch nicht bereits ein Teilnehmer sein.
          $ne: userId,
        },
      },
      {
        $push: {
          applicants: {
            user: userId,
          },
        },
      },
    );
  }

  public async removeUserAsApplicantById(userId: string): Promise<void> {
    this.logger.info(`User ${userId} removes application from ${this.assignmentId}`);

    await this.collection.updateAsync(
      {
        _id: this.assignmentId,
      },
      {
        $pull: {
          applicants: {
            user: userId,
          }, // Wird als Bewerber entfernt.
        },
      },
    );
  }
}

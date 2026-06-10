import * as _ from "underscore";
import { AssignmentDAO } from "../../../collections/lib/AssignmentsCollection";
import { AssignmentState } from "../../../collections/lib/classes/AssignmentState";
import { AssignmentEventType } from "../../../imports/assignments/interfaces/AssignmentEventType";
import { SimpleCollection } from "../../../imports/interfaces/SimpleCollection";
import { Logger } from "../../../imports/logging/Logger";
import { LoggerFactory } from "../../../imports/logging/LoggerFactory";
import { IAssignmentCloser } from "../interfaces/IAssignmentCloser";
import { IAssignmentNotifier } from "../interfaces/IAssignmentNotifier";
import { IAssignmentParticipantControllerFactory } from "../interfaces/IAssignmentParticipantControllerFactory";
import { extractIdsFromUserEntryArray } from "../utils/UserEntryHelper";
import { AssignmentAction } from "./AssignmentAction";

export class AssignmentCloser extends AssignmentAction implements IAssignmentCloser {
  private logger: Logger;

  constructor(
    collection: SimpleCollection<AssignmentDAO>,
    private assignmentNotifier: IAssignmentNotifier,
    private assignmentParticipantController: IAssignmentParticipantControllerFactory,
    loggerFactory: LoggerFactory,
  ) {
    super(collection);
    this.logger = loggerFactory.createLogger("AssignmentCloser");
  }

  async closeAssignment(options: {
    assignmentId: string;
    participantIds: Array<string>;
  }): Promise<void> {
    this.logger.info(
      `Closing assignment ${options.assignmentId} with participants: ${JSON.stringify(options.participantIds)}`,
    );

    let assignment = await this.getAssignment(options.assignmentId);
    this.logger.debug(`Old assignment: ${JSON.stringify(assignment)}`);

    await this.updateEntryInDatabase(assignment);
    let thereAreNewParticipants = await this.addNewParticipantsAndNotify({
      oldAssignment: assignment,
      participantIds: options.participantIds,
    });
    let participantsGotRemoved = await this.removeOldParticipantsAndNotify({
      oldAssignment: assignment,
      participantIds: options.participantIds,
    });
    await this.determineAndNotifyRemovedUsers(assignment, options.participantIds);

    if (thereAreNewParticipants || participantsGotRemoved) {
      await this.determineAndNotifyRemainingParticipantsAboutChange(
        assignment,
        options.participantIds,
      );
    }
  }

  private async updateEntryInDatabase(assignment: AssignmentDAO): Promise<void> {
    this.logger.debug(`Update entry in database`);

    await this.collection.updateAsync(
      { _id: assignment._id },
      {
        $set: {
          applicants: [],
          state: AssignmentState[AssignmentState.Closed],
        },
      },
    );
  }

  private async addNewParticipantsAndNotify(options: {
    oldAssignment: AssignmentDAO;
    participantIds: Array<string>;
  }): Promise<boolean> {
    this.logger.info(`Adding participants: ${JSON.stringify(options.participantIds)}`);
    let changed = false;
    for (const userId of options.participantIds) {
      let userGotAdded = await this.assignmentParticipantController(
        options.oldAssignment._id,
      ).addUserAsParticipantAndNotify(userId);

      if (userGotAdded) {
        changed = true;
      }
    }

    return changed;
  }

  private async removeOldParticipantsAndNotify(options: {
    oldAssignment: AssignmentDAO;
    participantIds: Array<string>;
  }): Promise<boolean> {
    let toBeRemoved = this.determineRemovedParticipants(
      options.oldAssignment,
      options.participantIds,
    );
    this.logger.info(`Removing participants: ${JSON.stringify(toBeRemoved)}`);
    let changed = false;

    for (const userId of toBeRemoved) {
      let userGotRemoved = await this.assignmentParticipantController(
        options.oldAssignment._id,
      ).removeUserAsParticipantAndNotify(userId);

      if (userGotRemoved) {
        changed = true;
      }
    }

    return changed;
  }

  private determineRemovedParticipants(
    assignment: AssignmentDAO,
    participants: Array<string>,
  ): Array<string> {
    let oldParticipants = extractIdsFromUserEntryArray(assignment.participants);
    let removedParticipants = _.difference(oldParticipants, participants);

    return removedParticipants;
  }

  private async determineAndNotifyRemovedUsers(
    assignment: AssignmentDAO,
    participants: Array<string>,
  ): Promise<void> {
    let oldApplicants = extractIdsFromUserEntryArray(assignment.applicants);
    let removedApplicants = _.difference(oldApplicants, participants);
    this.logger.info(`Notifying removed applicants: ${JSON.stringify(removedApplicants)}`);

    for (const userId of removedApplicants) {
      await this.assignmentNotifier.notifyUserAboutAssignment({
        userId,
        assignmentId: assignment._id,
        eventType: AssignmentEventType.Removed,
      });
    }
  }

  private async determineAndNotifyRemainingParticipantsAboutChange(
    assignment: AssignmentDAO,
    participants: Array<string>,
  ): Promise<void> {
    let oldParticipants = extractIdsFromUserEntryArray(assignment.participants);
    let remainingParticipants = _.intersection(oldParticipants, participants);
    this.logger.info(
      `Notifying former participants about change: ${JSON.stringify(remainingParticipants)}`,
    );

    for (const userId of remainingParticipants) {
      await this.assignmentNotifier.notifyUserAboutAssignment({
        userId,
        assignmentId: assignment._id,
        eventType: AssignmentEventType.Modified,
      });
    }
  }
}

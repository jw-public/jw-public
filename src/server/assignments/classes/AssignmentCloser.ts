import { inject, injectable, named } from 'inversify';
import * as _ from 'underscore';
import { AssignmentDAO } from '../../../collections/lib/AssignmentsCollection';
import { AssignmentState } from '../../../collections/lib/classes/AssignmentState';
import { AssignmentEventType } from '../../../imports/assignments/interfaces/AssignmentEventType';
import { SimpleCollection } from '../../../imports/interfaces/SimpleCollection';
import { Logger } from '../../../imports/logging/Logger';
import { LoggerFactory } from '../../../imports/logging/LoggerFactory';
import { Types } from '../../Types';
import { AssignmentServiceTypes } from '../AssignmentServiceTypes';
import { IAssignmentCloser } from '../interfaces/IAssignmentCloser';
import { IAssignmentNotifier } from '../interfaces/IAssignmentNotifier';
import { IAssignmentParticipantControllerFactory } from '../interfaces/IAssignmentParticipantControllerFactory';
import { extractIdsFromUserEntryArray } from '../utils/UserEntryHelper';
import { AssignmentAction } from './AssignmentAction';



@injectable()
export class AssignmentCloser extends AssignmentAction implements IAssignmentCloser {
    private logger: Logger;

    constructor(@inject(Types.Collection) @named("assignment") collection: SimpleCollection<AssignmentDAO>,
        @inject(AssignmentServiceTypes.IAssignmentNotifier) private assignmentNotifier: IAssignmentNotifier,
        @inject(Types.IAssignmentParticipantControllerFactory) private assignmentParticipantController: IAssignmentParticipantControllerFactory,
        @inject(Types.LoggerFactory) loggerFactory: LoggerFactory,
    ) {
        super(collection);
        this.logger = loggerFactory.createLogger("AssignmentCloser");
    }

    closeAssignment(options: {
        assignmentId: string;
        participantIds: Array<string>
    }): void {

        this.logger.info(`Closing assignment ${options.assignmentId} with participants: ${JSON.stringify(options.participantIds)}`);

        let assignment = this.getAssignment(options.assignmentId);
        this.logger.debug(`Old assignment: ${JSON.stringify(assignment)}`);



        this.updateEntryInDatabase(assignment);
        let thereAreNewParticipants = this.addNewParticipantsAndNotify({
            oldAssignment: assignment,
            participantIds: options.participantIds
        });
        let participantsGotRemoved = this.removeOldParticipantsAndNotify({
            oldAssignment: assignment,
            participantIds: options.participantIds
        });
        this.determineAndNotifyRemovedUsers(assignment, options.participantIds);

        if (thereAreNewParticipants || participantsGotRemoved) {
            this.determineAndNotifyRemainingParticipantsAboutChange(assignment, options.participantIds);
        }
    }

    private updateEntryInDatabase(assignment: AssignmentDAO): void {
        this.logger.debug(`Update entry in database`);

        this.collection.update({ _id: assignment._id }, {
            $set: {
                applicants: [],
                state: AssignmentState[AssignmentState.Closed]
            }
        });
    }

    private addNewParticipantsAndNotify(options: {
        oldAssignment: AssignmentDAO;
        participantIds: Array<string>
    }): boolean {
        this.logger.info(`Adding participants: ${JSON.stringify(options.participantIds)}`);
        let changed = false;
        for (const userId of options.participantIds) {
            let userGotAdded = this.assignmentParticipantController(options.oldAssignment._id).addUserAsParticipantAndNotify(userId);

            if (userGotAdded) {
                changed = true;
            }
        }

        return changed;
    }

    private removeOldParticipantsAndNotify(options: {
        oldAssignment: AssignmentDAO;
        participantIds: Array<string>
    }) {
        let toBeRemoved = this.determineRemovedParticipants(options.oldAssignment, options.participantIds);
        this.logger.info(`Removing participants: ${JSON.stringify(toBeRemoved)}`);
        let changed = false;

        for (const userId of toBeRemoved) {
            let userGotRemoved = this.assignmentParticipantController(options.oldAssignment._id).removeUserAsParticipantAndNotify(userId);

            if (userGotRemoved) {
                changed = true;
            }
        }

        return changed;

    }


    private determineRemovedParticipants(assignment: AssignmentDAO, participants: Array<string>): Array<string> {
        let oldParticipants = extractIdsFromUserEntryArray(assignment.participants);
        let removedParticipants = _.difference(oldParticipants, participants);

        return removedParticipants;
    }


    private determineAndNotifyRemovedUsers(assignment: AssignmentDAO, participants: Array<string>) {
        let oldApplicants = extractIdsFromUserEntryArray(assignment.applicants);
        let removedApplicants = _.difference(oldApplicants, participants);
        this.logger.info(`Notifying removed applicants: ${JSON.stringify(removedApplicants)}`);

        for (const userId of removedApplicants) {
            this.assignmentNotifier.notifyUserAboutAssignment({
                userId,
                assignmentId: assignment._id,
                eventType: AssignmentEventType.Removed
            });
        }
    }


    private determineAndNotifyRemainingParticipantsAboutChange(assignment: AssignmentDAO, participants: Array<string>) {
        let oldParticipants = extractIdsFromUserEntryArray(assignment.participants);
        let remainingParticipants = _.intersection(oldParticipants, participants);
        this.logger.info(`Notifying former participants about change: ${JSON.stringify(remainingParticipants)}`);

        for (const userId of remainingParticipants) {
            this.assignmentNotifier.notifyUserAboutAssignment({
                userId,
                assignmentId: assignment._id,
                eventType: AssignmentEventType.Modified
            });
        }
    }

}

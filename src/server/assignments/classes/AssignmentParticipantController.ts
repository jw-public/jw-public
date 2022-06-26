import { inject, injectable, named } from 'inversify';
import * as _ from 'underscore';
import { AssignmentDAO } from '../../../collections/lib/AssignmentsCollection';
import { SimpleCollection } from '../../../imports/interfaces/SimpleCollection';
import { Types } from '../../Types';
import { AssignmentServiceTypes } from '../AssignmentServiceTypes';
import { IAssignmentContext } from '../interfaces/IAssignmentContext';
import { IAssignmentParticipantController } from '../interfaces/IAssignmentParticipantController';
import { IAssignmentParticipationNotifier } from '../interfaces/IAssignmentParticipationNotifier';
import { extractIdsFromUserEntryArray } from '../utils/UserEntryHelper';
import { AssignmentAction } from './AssignmentAction';


@injectable()
export class AssignmentParticipantController extends AssignmentAction implements IAssignmentParticipantController {

    private assignmentContext: IAssignmentContext;

    constructor(@inject(Types.Collection) @named("assignment") protected collection: SimpleCollection<AssignmentDAO>,
        @inject(AssignmentServiceTypes.IAssignmentParticipationNotifier) private participationNotifier: IAssignmentParticipationNotifier) {
        super(collection);
    }

    get assignmentId(): string {
        return this.assignmentContext.getAssignmentId();
    }

    public addUserAsParticipantAndNotify(userId: string): boolean {

        let isNotAlreadyParticipant = this.userIsNotAlreadyParticipant(userId);

        if (isNotAlreadyParticipant) {
            this.addUserAsParticipantInDatabase(userId);
            this.participationNotifier.notifyUsersAreAccepted({
                assignmentId: this.assignmentId,
                userIds: [userId]
            });
        }

        return isNotAlreadyParticipant;
    }

    private userIsNotAlreadyParticipant(userId: string): boolean {
        return !this.userIsParticipant(userId);
    }

    private userIsParticipant(userId: string): boolean {
        let assignment = this.getAssignment(this.assignmentId);
        let participants = extractIdsFromUserEntryArray(assignment.participants);
        return _.contains(participants, userId);
    }

    private addUserAsParticipantInDatabase(userId: string) {
        this.collection.update({
            _id: this.assignmentId,
            "participants.user": { // User darf nicht bereits ein Teilnehmer sein.
                $ne: userId
            }
        }, {
            $push: {
                participants: {
                    user: userId
                }
            },
            $pull: {
                applicants: {
                    user: userId
                }
            }
        });
    }

    public removeUserAsParticipantAndNotify(userId: string): boolean {
        let userIsParticipant = this.userIsParticipant(userId);

        if (userIsParticipant) {
            this.collection.update({
                _id: this.assignmentId
            }, {
                $pull: {
                    "participants": {
                        "user": userId
                    } // Wird als Teilnehmer entfernt.
                }
            });

            this.participationNotifier.notifyUsersAreNotAccepted({
                assignmentId: this.assignmentId,
                userIds: [userId]
            });
        }


        return userIsParticipant;
    }



}

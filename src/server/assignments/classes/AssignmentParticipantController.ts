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

    public async addUserAsParticipantAndNotify(userId: string): Promise<boolean> {

        let isNotAlreadyParticipant = await this.userIsNotAlreadyParticipant(userId);

        if (isNotAlreadyParticipant) {
            await this.addUserAsParticipantInDatabase(userId);
            await this.participationNotifier.notifyUsersAreAccepted({
                assignmentId: this.assignmentId,
                userIds: [userId]
            });
        }

        return isNotAlreadyParticipant;
    }

    private async userIsNotAlreadyParticipant(userId: string): Promise<boolean> {
        return !(await this.userIsParticipant(userId));
    }

    private async userIsParticipant(userId: string): Promise<boolean> {
        let assignment = await this.getAssignment(this.assignmentId);
        let participants = extractIdsFromUserEntryArray(assignment.participants);
        return _.contains(participants, userId);
    }

    private async addUserAsParticipantInDatabase(userId: string): Promise<void> {
        await this.collection.updateAsync({
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

    public async removeUserAsParticipantAndNotify(userId: string): Promise<boolean> {
        let userIsParticipant = await this.userIsParticipant(userId);

        if (userIsParticipant) {
            await this.collection.updateAsync({
                _id: this.assignmentId
            }, {
                $pull: {
                    "participants": {
                        "user": userId
                    } // Wird als Teilnehmer entfernt.
                }
            });

            await this.participationNotifier.notifyUsersAreNotAccepted({
                assignmentId: this.assignmentId,
                userIds: [userId]
            });
        }


        return userIsParticipant;
    }



}
